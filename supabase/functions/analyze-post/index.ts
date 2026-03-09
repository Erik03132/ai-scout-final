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
        console.log(`Gemini API Key length: ${geminiApiKey?.length || 0}`);
        if (!geminiApiKey) {
            console.warn("GEMINI_API_KEY is not set!");
        }

        // Получаем непроанализированные посты
        const { data: posts, error: postsError } = await supabase
            .from("posts")
            .select("*")
            .eq("is_analyzed", false)
            .limit(20);

        if (postsError) throw postsError;

        if (!posts || posts.length === 0) {
            return new Response(
                JSON.stringify({ message: "No posts to analyze" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

        const analyzedPosts = [];

        for (const post of posts) {
            let mentions: string[] = [];
            let detailedUsage = "";
            let usageTips: string[] = [];
            let additionalContext = "";

            // Если это ссылка на YouTube, попробуем получить описание видео для лучшего анализа
            if (youtubeApiKey && (post.url.includes("youtube.com") || post.url.includes("youtu.be"))) {
                try {
                    const videoId = post.url.includes("v=")
                        ? post.url.split("v=")[1].split("&")[0]
                        : post.url.split("/").pop();

                    if (videoId) {
                        const ytUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${youtubeApiKey}&part=snippet`;
                        const ytRes = await fetch(ytUrl);
                        const ytData = await ytRes.json();

                        if (ytData.items?.[0]) {
                            const snippet = ytData.items[0].snippet;
                            additionalContext = `\n--- КОНТЕКСТ ИЗ YOUTUBE ---\nЗаголовок видео: ${snippet.title}\nОписание видео: ${snippet.description}\n---------------------------\n`;
                        }
                    }
                } catch (e) {
                    console.error("Error fetching YouTube metadata:", e);
                }
            }

            // Если есть Gemini API - используем AI
            if (geminiApiKey || Deno.env.get("OPENROUTER_API_KEY")) {
                const prompt = `Ты — элитный ИИ-аналитик тех-новостей. Твоя цель: трансформировать сырой контент в идеальный структурированный отчет СТРОГО НА РУССКОМ ЯЗЫКЕ.
                
КРИТИЧЕСКАЯ ЗАДАЧА: Найди ВСЕ упоминания сервисов, нейросетей, программ и инструментов, которые обсуждаются в контенте. 
Если в тексте упоминается какой-то инструмент (например, Claude, ChatGPT, DeepSeek, Midjourney и т.д.), ОБЯЗАТЕЛЬНО добавь его в массив "mentions".

ИНСТРУКЦИИ ПО ЯЗЫКУ:
1. ПЕРЕВЕДИ заголовок контента на русский язык в поле "titleRu". Это ОБЯЗАТЕЛЬНО.
2. Весь текст в полях "summary", "detailedUsage" и "usageTips" должен быть ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
3. Используй профессиональный, но завлекающий стиль.

СТРУКТУРА ОТВЕТА (JSON):
{
  "titleRu": "ПЕРЕВЕДЕННЫЙ ЗАГОЛОВОК",
  "summary": "КРАТКАЯ СУТЬ НА РУССКОМ (2-3 предложения)",
  "tags": ["тег1", "тег2"],
  "mentions": ["ТочноеНазваниеСервиса1", "ТочноеНазваниеСервиса2"],
  "detailedUsage": "МАКСИМАЛЬНО ПОДРОБНЫЙ РУССКИЙ ТЕКСТ. Минимум 600 слов. Разбери все функции, возможности и способы применения упомянутых инструментов. Если это видео-обзор, перескажи ключевые моменты и что именно было показано.",
  "usageTips": ["практический совет 1", "практический совет 2", "практический совет 3"]
}

Контент для анализа:
Заголовок: ${post.title}
Описание: ${post.summary}
Полный текст/Контент: ${post.content || post.summary}
${additionalContext}
`;

                let aiTextResponse = "";
                let usedProvider = "";

                // Cascade Attempt 1: Direct Google Gemini (v1beta)
                if (geminiApiKey) {
                    try {
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0.1, maxOutputTokens: 4000, response_mime_type: "application/json" }
                            })
                        });
                        const data = await res.json();
                        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                            aiTextResponse = data.candidates[0].content.parts[0].text;
                            usedProvider = "google-direct-v1beta";
                        } else {
                            console.warn("Direct Google (v1beta) failed, trying fallback...", data);
                        }
                    } catch (e) {
                        console.warn("Direct Google (v1beta) error:", e);
                    }
                }

                // Cascade Attempt 2: OpenRouter (Fallback)
                if (!aiTextResponse && Deno.env.get("OPENROUTER_API_KEY")) {
                    try {
                        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
                                "HTTP-Referer": "https://supabase.com",
                                "X-Title": "AI Scout Analysis"
                            },
                            body: JSON.stringify({
                                model: "google/gemini-2.0-flash-001",
                                messages: [{ role: "user", content: prompt }],
                                response_format: { type: "json_object" }
                            })
                        });
                        const data = await res.json();
                        if (data.choices?.[0]?.message?.content) {
                            aiTextResponse = data.choices[0].message.content;
                            usedProvider = "openrouter";
                        } else {
                            console.warn("OpenRouter fallback failed:", data);
                        }
                    } catch (e) {
                        console.warn("OpenRouter error:", e);
                    }
                }

                // Cascade Attempt 3: Direct Google (v1) - Legacy Fallback
                if (!aiTextResponse && geminiApiKey) {
                    try {
                        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: prompt }] }],
                                generationConfig: { temperature: 0.1, maxOutputTokens: 4000 }
                            })
                        });
                        const data = await res.json();
                        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                            aiTextResponse = data.candidates[0].content.parts[0].text;
                            usedProvider = "google-direct-v1-legacy";
                        }
                    } catch (e) {
                        console.warn("Legacy fallback failed:", e);
                    }
                }

                if (aiTextResponse) {
                    try {
                        const match = aiTextResponse.match(/\{[\s\S]*\}/);
                        const aiResult = JSON.parse(match ? match[0] : aiTextResponse);

                        if (aiResult.titleRu) {
                            post.title = aiResult.titleRu;
                        }

                        if (aiResult.summary) {
                            post.summary = aiResult.summary;
                        }

                        // Очищаем массив упоминаний от дубликатов
                        if (aiResult.mentions && Array.isArray(aiResult.mentions)) {
                            mentions = Array.from(new Set(aiResult.mentions.map((m: any) => String(m).trim())));
                        } else {
                            mentions = [];
                        }

                        // Добавляем теги, если они есть
                        const tags = Array.from(new Set([...(post.tags || []), ...(aiResult.tags || [])]));
                        post.tags = tags;

                        detailedUsage = aiResult.detailedUsage || "";
                        usageTips = aiResult.usageTips || [];
                    } catch (e) {
                        console.error(`Failed to parse AI response from ${usedProvider}:`, e);
                        detailedUsage = `[DEBUG JSON ERROR] Provider ${usedProvider} generated invalid JSON:\n\n${aiTextResponse}`;
                    }
                } else {
                    detailedUsage = `⚠️ ИИ-анализ временно недоступен. Все провайдеры (Direct Google, OpenRouter) вернули ошибку или исчерпали квоту.`;
                }
            } else {
                // Fallback if no AI key
                detailedUsage = `Полезный контент о ${post.tags?.join(", ") || "технологиях"} из канала ${post.channel}.`;
                usageTips = ["Изучите материал", "Примените на практике"];
            }

            // Обновляем пост
            const { error: updateError } = await supabase
                .from("posts")
                .update({
                    title: post.title,
                    summary: post.summary,
                    tags: post.tags,
                    mentions,
                    detailed_usage: detailedUsage,
                    usage_tips: usageTips,
                    is_analyzed: true,
                })
                .eq("id", post.id);

            if (!updateError) {
                analyzedPosts.push({ id: post.id, mentions, title: post.title });
            }
        }

        return new Response(
            JSON.stringify({ success: true, analyzedPosts, debug: { keyLength: geminiApiKey?.length || 0 } }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
