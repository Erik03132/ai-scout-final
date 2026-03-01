import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const prompt = `Quick facts about AI tool "${name}": 
    1. 1-sentence summary
    2. category
    3. emoji icon
    4. pricing
    5. 3 features. 
    Output clean JSON in Russian. 
    Format: {"summary": "...", "category": "...", "icon": "...", "pricing": "...", "features": ["...", "...", "..."]}`;

    try {
        console.log(`[Backend] Cascaded enrichment for: ${name}`);
        const result = await generateEnrichmentWithCascade(name, prompt);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(`[Final Error] All providers failed for ${name}:`, error.message);
        return res.status(500).json({
            error: 'All AI providers failed',
            details: error.message
        });
    }
}

async function generateEnrichmentWithCascade(name: string, prompt: string) {
    let lastError: any = null;

    // 1. Gemini
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("[Enrichment] Attempting Gemini...");
            const data = await callGemini(prompt);
            return { ...data, name };
        } catch (e) {
            console.error("Gemini failed:", e);
            lastError = e;
        }
    }

    // 2. OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log("[Enrichment] Attempting OpenRouter...");
            const data = await callOpenRouter(prompt);
            return { ...data, name };
        } catch (e) {
            console.error("OpenRouter failed:", e);
            lastError = e;
        }
    }

    // 3. OpenAI
    if (process.env.OPENAI_API_KEY) {
        try {
            console.log("[Enrichment] Attempting OpenAI...");
            const data = await callOpenAI(prompt);
            return { ...data, name };
        } catch (e) {
            console.error("OpenAI failed:", e);
            lastError = e;
        }
    }

    // 4. Kimi (Moonshot)
    if (process.env.MOONSHOT_API_KEY) {
        try {
            console.log("[Enrichment] Attempting Moonshot...");
            const data = await callKimi(prompt);
            return { ...data, name };
        } catch (e) {
            console.error("Moonshot failed:", e);
            lastError = e;
        }
    }

    throw lastError || new Error('All LLM providers failed');
}

async function callGemini(prompt: string) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Gemini error ${response.status}: ${txt.substring(0, 100)}`);
    }

    const data = await response.json();
    return parseLLMResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || '');
}

async function callOpenAI(prompt: string) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const data = await response.json();
    return JSON.parse(data.choices[0]?.message?.content || '{}');
}

async function callOpenRouter(prompt: string) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
            model: 'google/gemini-flash-1.5',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
        })
    });

    if (!response.ok) throw new Error(`OpenRouter error ${response.status}`);
    const data = await response.json();
    return parseLLMResponse(data.choices[0]?.message?.content || '');
}

async function callKimi(prompt: string) {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`
        },
        body: JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
        })
    });

    if (!response.ok) throw new Error(`Kimi error ${response.status}`);
    const data = await response.json();
    return parseLLMResponse(data.choices[0]?.message?.content || '');
}

function parseLLMResponse(text: string) {
    try {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error('[Parse Error] Raw:', text);
        throw new Error('Failed to parse AI JSON');
    }
}
