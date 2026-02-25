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
1. "mentions" - массив ТОЛЬКО AI-инструментов, LLM и специализированных сервисов (например: ChatGPT, Claude, Vercel v0, Kimi). Строго игнорируй обычные языки/фреймворки.
2. "detailedUsage" - Развернутый аналитический обзор контента (3-5 емких предложений). Опиши ГЛАВНУЮ ИДЕЮ технического решения, решаемую проблему и предложенную архитектуру/подход. Пиши профессиональным языком разработчика.
3. "usageTips" - массив из 5 КОНКРЕТНЫХ и ПРАКТИЧНЫХ советов, извлеченных прямо из текста, которые можно сразу применить.

Верни только JSON без markdown:
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
                        let textParams = data.candidates[0].content.parts[0].text;
                        const match = textParams.match(/\{[\s\S]*\}/);
                        if (match) {
                            textParams = match[0];
                        }
                        const aiResult = JSON.parse(textParams);
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
