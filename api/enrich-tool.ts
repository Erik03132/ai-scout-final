import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tool name is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY logic missing' });

    try {
        console.log(`Starting enrichment for: ${name}`);
        const prompt = `Найди актуальную, ФАКТИЧЕСКУЮ информацию о сервисе "${name}" (это AI инструмент).
        Используй поиск Google, чтобы узнать тарифы, лимиты и основные функции.
        
        Верни СТРОГО JSON на русском языке:
        - description: Реальное описание сути сервиса (2-3 предложения).
        - category: Категория (напр. "Low-code", "LLM", "Design", "Automation").
        - icon: Уникальный эмодзи (НЕ шестеренка ⚙️).
        - dailyCredits: Реальные лимиты (напр. "5 кредитов" или "Н/Д").
        - monthlyCredits: Лимиты в месяц.
        - minPrice: Минимальная цена (напр. "$20/мес").
        - hasApi: boolean.
        - hasMcp: boolean.
        - docsUrl: Ссылка на сайт.
        - pros: Список из 3 преимуществ.
        - features: Список [{title, description}] из 3 фишек.
        
        ОТВЕЧАЙ ТОЛЬКО JSON.`;

        // Модель 2.0-flash с поиском
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "UNSPECIFIED", dynamic_threshold: 0.3 } } }],
                generationConfig: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Gemini Error (${response.status}):`, errText);
            throw new Error(`Gemini fail: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        console.log(`Gemini response for ${name}: success`);

        let result = JSON.parse(text);

        // Гарантируем наличие полей
        result.name = name;
        if (!result.features) result.features = [];
        if (!result.pros) result.pros = [];
        if (!result.icon) result.icon = '✨';

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Enrichment handler error:', error);
        return res.status(500).json({ error: error.message, details: 'Check server logs' });
    }
}
