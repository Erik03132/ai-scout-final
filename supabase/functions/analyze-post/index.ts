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
                const prompt = `Ты — элитный ИИ-аналитик. Твоя цель: трансформировать сырой контент в идеальный структурированный отчет СТРОГО НА РУССКОМ ЯЗЫКЕ.

ИНСТРУКЦИИ ПО ЯЗЫКУ (КРИТИЧЕСКИ ВАЖНО):
1. ПЕРЕВЕДИ заголовок контента на русский язык в поле "titleRu". Это ОБЯЗАТЕЛЬНО.
2. Весь текст в полях "summary", "detailedUsage" и "usageTips" должен быть ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
3. Используй профессиональный, но доступный стиль.

СТРУКТУРА ОТВЕТА (JSON):
{
  "titleRu": "ПЕРЕВЕДЕННЫЙ ЗАГОЛОВОК",
  "summary": "КРАТКАЯ СУТЬ НА РУССКОМ",
  "tags": ["тег1", "тег2"],
  "mentions": ["Сервис1", "Сервис2"],
  "detailedUsage": "ПОДРОБНЫЙ РУССКИЙ ТЕКСТ. Минимум 500 слов. Разбери всё до мелочей.",
  "usageTips": ["совет 1", "совет 2"]
}

Контент для анализа:
Заголовок: ${post.title}
Описание: ${post.summary}
Полный текст: ${post.content || post.summary}
`;

                const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

                const response = await fetch(geminiUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 3000,
                            responseMimeType: "application/json"
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

                        // Если AI перевел заголовок, обновляем его
                        if (aiResult.titleRu) {
                            post.title = aiResult.titleRu;
                        }

                        if (aiResult.summary) {
                            post.summary = aiResult.summary;
                        }

                        // Очищаем массив упоминаний от дубликатов с помощью Set
                        if (aiResult.mentions && Array.isArray(aiResult.mentions)) {
                            mentions = Array.from(new Set(aiResult.mentions.map((m: string) => typeof m === 'string' ? m.trim() : m)));
                        } else {
                            mentions = [];
                        }
                        detailedUsage = aiResult.detailedUsage || "";
                        usageTips = aiResult.usageTips || [];
                    } catch (e) {
                        console.error("Failed to parse AI response:", e);
                        // Save the raw text in detailedUsage so we can debug it
                        detailedUsage = `[DEBUG JSON ERROR] AI generated invalid JSON:\n\n${data.candidates[0].content.parts[0].text}`;
                    }
                } else {
                    console.error("Gemini API Error:", data);
                    detailedUsage = `⚠️ ИИ-анализ временно недоступен (ошибка API Gemini).\n\nДетали ошибки:\n${JSON.stringify(data, null, 2)}`;
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
                    title: post.title,
                    summary: post.summary,
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
