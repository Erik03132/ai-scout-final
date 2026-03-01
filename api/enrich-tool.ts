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

    const prompt = `ТЫ — ЭЛИТНЫЙ ТЕХНОЛОГИЧЕСКИЙ АНАЛИТИК. Твоя задача — составить максимально точный, актуальный и глубокий отчет об ИИ-инструменте "${name}".
    
    КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
    1. НИКАКИХ ГАЛЛЮЦИНАЦИЙ. Если ты не знаешь инструмент, напиши "Нуждается в уточнении" в описании.
    2. ПРОВЕРЬ СВОИ ЗНАНИЯ: 
       - Lyria (Google DeepMind) — это музыка и аудио (НЕ ИЗОБРАЖЕНИЯ).
       - Lovable — это билдер веб-приложений (React/Supabase), конкурент Bolt.new.
    3. ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ.
    4. ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON.

    СТРУКТУРА JSON:
    - description: Минимум 3-4 абзаца. Подробно: что это, функционал, для кого, уникальные фишки.
    - category: ОДНА ИЗ: "AI / LLM", "Web / Dev", "Voice / Audio", "Design / Video", "Utilities".
    - icon: 1 подходящий эмодзи.
    - minPrice: Цена (напр. "$20/мес", "Бесплатно").
    - dailyCredits: Сколько попыток/кредитов в день.
    - monthlyCredits: Сколько в месяц.
    - hasApi: true/false.
    - hasMcp: true/false (Model Context Protocol).
    - features: 5-6 объектов [{"title": "Название", "description": "Суть"}].
    - useCases: 3 объекта [{"title": "Кейс", "description": "Бизнес-применение", "complexity": "Simple/Medium/Hard"}].
    - docsUrl: Ссылка на документацию или оф. сайт.
    - pros: Список из 3-4 коротких плюсов.

    ПИШИ КАК ЧЕЛОВЕК-ЭКСПЕРТ, А НЕ КАК БОТ.`;

    try {
        console.log(`[Backend] Cascaded enrichment for: ${name}`);
        const result = await generateEnrichmentWithCascade(name, prompt);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error(`[Final Error] All providers failed for ${name}:`, error.message);
        return res.status(500).json({ error: 'All AI providers failed', details: error.message });
    }
}

async function generateEnrichmentWithCascade(name: string, prompt: string) {
    let lastError: any = null;

    // 1. OpenRouter (Attempting Perplexity first for REAL-TIME SEARCH)
    if (process.env.OPENROUTER_API_KEY) {
        try {
            console.log("[Enrichment] Attempting OpenRouter (Perplexity/Sonar)...");
            // Мы используем Sonar, так как он имеет доступ к поиску и минимизирует галлюцинации
            const data = await callOpenRouter(prompt, 'perplexity/llama-3.1-sonar-large-128k-online');
            return { ...data, name };
        } catch (e) {
            console.error("OpenRouter Perplexity failed, falling back to Gemini...");
            lastError = e;

            try {
                const data = await callOpenRouter(prompt, 'google/gemini-2.0-flash-001');
                return { ...data, name };
            } catch (e2) {
                console.error("OpenRouter Gemini failed...");
                lastError = e2;
            }
        }
    }

    // 2. Gemini Direct
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("[Enrichment] Attempting Gemini Direct...");
            const data = await callGemini(prompt, 'v1beta', 'gemini-1.5-flash-latest');
            return { ...data, name };
        } catch (e) {
            console.error("Gemini Direct failed:", e);
            lastError = e;
        }
    }

    // 3. OpenAI Fallback
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
                maxOutputTokens: 2000,
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
            model: 'gpt-4o', // Используем полноценную 4o для повышения качества
            messages: [
                { role: 'system', content: 'Ты — элитный аналитик. Исследуй данные перед ответом. Отвечай только валидным JSON на русском языке.' },
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

async function callOpenRouter(prompt: string, model: string) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://ai-scout.vercel.app',
            'X-Title': 'AI Scout'
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'Ты — элитный аналитик с доступом к поиску. Твоя задача — предоставить точные данные без галлюцинаций. Отвечай только валидным JSON на русском языке.' },
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
        try {
            // Попытка очистить от markdown блоков если match не сработал
            const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        } catch (e2) {
            throw new Error('Failed to parse AI JSON response');
        }
    }
}
