import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Получаем API ключ Gemini из переменных
        const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

        // Получаем непроанализированные посты
        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("*")
            .eq("is_analyzed", false)
            .limit(5);

        if (postsError) throw postsError;

        if (!posts || posts.length === 0) {
            return new Response(
                JSON.stringify({ message: "No posts to analyze" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Получаем список инструментов для поиска упоминаний
        const { data: tools } = await supabase
            .from("tools")
            .select("name");

        const toolNames = tools?.map(t => t.name) || [];

        const analyzedPosts = [];

        for (const post of posts) {
            let mentions: string[] = [];
            let detailedUsage = "";
            let usageTips: string[] = [];

            // Если есть Gemini API - используем AI
            if (geminiApiKey) {
                const prompt = `
Проанализируй этот пост и извлеки информацию:

Заголовок: ${post.title}
Описание: ${post.summary}
Контент: ${post.content || post.summary}

Список известных инструментов в системе: ${toolNames.join(", ")}

Ты должен вернуть JSON с полями:
1. "mentions" - массив названий инструментов из списка, которые упоминаются в посте
2. "detailedUsage" - подробное описание как использовать это в реальной работе (2-3 предложения)
3. "usageTips" - массив из 5 конкретных советов

Верни только JSON, без дополнительного текста.
`;

                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;

                const response = await fetch(geminiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1000,
                        }
                    })
                });

                const data = await response.json();

                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    try {
                        const aiResult = JSON.parse(data.candidates[0].content.parts[0].text);
                        mentions = aiResult.mentions || [];
                        detailedUsage = aiResult.detailedUsage || "";
                        usageTips = aiResult.usageTips || [];
                    } catch (e) {
                        console.error("Failed to parse AI response:", e);
                    }
                }
            } else {
                // Fallback: простое извлечение тегов из названия
                mentions = toolNames.filter(tool =>
                    (post.title + " " + post.summary).toLowerCase().includes(tool.toLowerCase())
                );

                detailedUsage = `Полезный контент о ${post.tags?.join(", ") || "технологиях"} из канала ${post.channel}.`;
                usageTips = [
                    "Изучите материал полностью",
                    "Попробуйте применить полученные знания",
                    "Экспериментируйте с кодом",
                    "Документируйте свой опыт",
                    "Поделитесь результатами с сообществом"
                ];
            }

            // Обновляем пост
            const { error: updateError } = await supabase
                .from("posts")
                .update({
                    mentions,
                    detailed_usage: detailedUsage,
                    usage_tips: usageTips,
                    is_analyzed: true,
                })
                .eq("id", post.id);

            if (!updateError) {
                analyzedPosts.push({ id: post.id, mentions, detailedUsage, usageTips });
            }
        }

        return new Response(
            JSON.stringify({ success: true, analyzedPosts }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
