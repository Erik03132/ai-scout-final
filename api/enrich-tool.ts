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

    const prompt = `Составь подробный отчет об ИИ-инструменте "${name}" СТРОГО В ФОРМАТЕ JSON.
    ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ. ВЕРНИ ТОЛЬКО JSON.
    ПОЛЯ:
    - description: Подробное описание (минимум 2 предложения).
    - category: Категория (напр. "Чат-боты", "Анализ данных").
    - icon: 1 подходящий эмодзи.
    - minPrice: Минимальная цена или "Бесплатно".
    - dailyCredits: Сколько бесплатных кредитов в день (напр. "5" или "Безлимит").
    - monthlyCredits: Лимитов в месяц (напр. "150" или "н/д").
    - hasApi: true/false (логическое значение).
    - hasMcp: true/false (логическое значение).
    - features: Список из 3 объектов [{"title": "Название", "description": "Описание"}].
    
    Пример: {
      "description": "Мощный ИИ для...", 
      "category": "Чат-боты", 
      "icon": "🤖", 
      "minPrice": "Бесплатно", 
      "dailyCredits": "10", 
      "monthlyCredits": "300", 
      "hasApi": true, 
      "hasMcp": false, 
      "features": [{"title": "Скорость", "description": "Мгновенный ответ"}]
    }`;

    try {
        console.log(`[Backend] Cascaded enrichment for: ${name}`);
        const result = await generateEnrichmentWithCascade(name, prompt);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(`[Final Error] All providers failed for ${name}:`, error.message);

        // Return a basic fallback instead of 500 so the UI doesn't show a red bar if possible, 
        // OR return 500 if we want the red bar. The user UI shows red bar for 500.
        return res.status(500).json({
            error: 'All AI providers failed',
            details: error.message
        });
    }
}

async function generateEnrichmentWithCascade(name: string, prompt: string) {
    let lastError: any = null;

    // 1. Gemini Direct (Attempt v1 and v1beta)
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("[Enrichment] Attempting Gemini v1...");
            const data = await callGemini(prompt, 'v1', 'gemini-1.5-flash-latest');
            return { ...data, name };
        } catch (e) {
            console.error("Gemini v1 failed:", e);
            lastError = e;

            try {
                console.log("[Enrichment] Attempting Gemini v1beta...");
                const data = await callGemini(prompt, 'v1beta', 'gemini-1.5-flash-latest');
                return { ...data, name };
            } catch (e2) {
                console.error("Gemini v1beta failed:", e2);
                lastError = e2;
            }
        }
    }

    // 2. OpenRouter (Using the model known to work in summarize.ts)
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

    throw lastError || new Error('All LLM providers failed');
}

async function callGemini(prompt: string, apiVersion: string, model: string) {
    const response = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 1000,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Gemini ${apiVersion} error ${response.status}: ${txt.substring(0, 100)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseLLMResponse(text);
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
            messages: [
                { role: 'system', content: 'Ты — элитный аналитик. Отвечай только валидным JSON на русском языке.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${txt.substring(0, 100)}`);
    }
    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    return parseLLMResponse(text);
}

async function callOpenRouter(prompt: string) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://ai-scout.vercel.app',
            'X-Title': 'AI Scout'
        },
        body: JSON.stringify({
            model: 'google/gemini-2.0-flash-001',
            messages: [
                { role: 'system', content: 'Ты — элитный аналитик. Отвечай только валидным JSON на русском языке.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${txt.substring(0, 100)}`);
    }
    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    return parseLLMResponse(text);
}

function parseLLMResponse(text: string) {
    try {
        let jsonStr = text;
        const match = text.match(/\{[\s\S]*\}/);
        if (match) jsonStr = match[0];
        return JSON.parse(jsonStr.trim());
    } catch (e) {
        console.error('[Parse Error] Raw:', text);
        throw new Error('Failed to parse AI JSON response');
    }
}
