import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tool name is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY logic missing' });

    try {
        const prompt = `Найди актуальную, ФАКТИЧЕСКУЮ информацию о сервисе "${name}" (это AI инструмент).
        Используй поиск Google, чтобы узнать:
        1. Что это на самом деле (не путай названия!).
        2. Какие там тарифы и лимиты сейчас.
        3. ПОДБЕРИ уникальную и узнаваемую иконку-эмодзи (emoji), которая максимально подходит под бренд или основную функцию этого конкретного сервиса.
        
        Верни СТРОГО JSON на русском языке:
        - description: Реальное описание сути сервиса (2-3 предложения).
        - category: Категория (напр. "Low-code", "LLM", "Design", "Automation").
        - icon: Уникальный эмодзи (НЕ шестеренка ⚙️, если можно найти что-то более узнаваемое для бренда).
        - dailyCredits: Реальные лимиты (напр. "5 кредитов" или "Н/Д").
        - monthlyCredits: Лимиты в месяц.
        - minPrice: Минимальная цена (напр. "$20/мес").
        - hasApi: boolean (есть ли API у сервиса).
        - hasMcp: boolean (есть ли поддержка MCP).
        - docsUrl: Ссылка на сайт (напр. https://...).
        - pros: Список из 3 преимуществ.
        - features: Список [{title, description}] из 3 фишек.

        ОТВЕЧАЙ ТОЛЬКО JSON БЕЗ ЛИШНЕГО ТЕКСТА.`;

        // Прямой вызов Gemini с включенным поиском (Google Search Grounding)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ google_search: {} }], // ВКЛЮЧАЕМ ПОИСК
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) throw new Error(`Gemini fail: ${response.status}`);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const result = JSON.parse(text);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Enrichment failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
