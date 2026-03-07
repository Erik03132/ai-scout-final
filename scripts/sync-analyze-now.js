const supabaseUrl = "https://iwtlekdynhfcqgwhocik.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
const geminiApiKey = "AIzaSyDbotAo70SWBNG-lHDIKBvNjJoOjxtyRQQ";

async function supabaseFetch(table, method, body, query = "") {
    const url = `${supabaseUrl}/rest/v1/${table}${query}`;
    const opts = {
        method,
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": method === "PATCH" ? "return=representation" : ""
        }
    };
    if (body) Object.assign(opts, { body: JSON.stringify(body) });
    const r = await fetch(url, opts);
    if (!r.ok) {
        console.error(`Supabase Error: ${await r.text()}`);
        throw new Error("Supabase Error");
    }
    return r.json();
}

async function analyzeWithGemini(post) {
    const prompt = `Проанализируй этот ИИ-ориентированный контент на строго РУССКОМ языке.
Оригинальное название: ${post.title}
Описание: ${post.summary || ""}
Полный текст: ${post.content || ""}

ВЕРНИ СТРОГО JSON:
{
  "titleRu": "ПЕРЕВОД НАЗВАНИЯ НА РУССКИЙ",
  "summary": "Краткое саммари на русском (2-3 предложения)",
  "tags": ["AI", "React", "и еще теги"],
  "mentions": ["Cursor", "Cursor.sh", "Claude", "OpenAI", "ChatGPT", "Midjourney", "имена других программ/утилит без символа @"],
  "detailedUsage": "Подробное описание сути (на русском)",
  "usageTips": ["совет 1 по применению", "совет 2", "совет 3"]
}
`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json"
            }
        })
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function run() {
    console.log("Fetching unanalyzed posts...");
    const posts = await supabaseFetch("posts", "GET", null, "?is_analyzed=eq.false&order=created_at.desc&limit=100");
    console.log(`Found ${posts.length} posts to analyze.`);

    let analyzedCount = 0;
    for (const post of posts) {
        try {
            console.log(`Analyzing: ${post.title}`);
            const result = await analyzeWithGemini(post);
            
            const updateData = {
                title: result.titleRu || post.title,
                summary: result.summary,
                tags: Array.isArray(result.tags) ? result.tags : post.tags,
                mentions: Array.isArray(result.mentions) ? result.mentions : [],
                detailed_usage: result.detailedUsage,
                usage_tips: result.usageTips,
                is_analyzed: true
            };

            await supabaseFetch("posts", "PATCH", updateData, `?id=eq.${post.id}`);
            console.log(`Successfully analyzed и updated: ${post.id}`);
            analyzedCount++;
        } catch (e) {
            console.error(`Error on post ${post.id}:`, e.message);
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    console.log(`Done! Analyzed ${analyzedCount} posts.`);
}
run();
