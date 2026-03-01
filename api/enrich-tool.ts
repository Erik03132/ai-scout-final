import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tool name is required' });

    try {
        const prompt = `Найди актуальную, ФАКТИЧЕСКУЮ информацию о сервисе "${name}" (это AI инструмент).
        ОБЯЗАТЕЛЬНО проверь через веб-поиск:
        1. Что это на самом деле (не путай названия!).
        2. Какие там тарифы и лимиты сейчас.
        
        Верни СТРОГО JSON на русском языке:
        - description: Реальное описание сути сервиса (2-3 предложения).
        - category: Категория (напр. "Low-code", "LLM", "Design").
        - icon: Подходящий эмодзи.
        - dailyCredits: Реальные лимиты (напр. "5 кредитов" или "Н/Д").
        - monthlyCredits: Лимиты в месяц.
        - minPrice: Минимальная цена (напр. "$20/мес").
        - hasApi: boolean (есть ли API у сервиса).
        - hasMcp: boolean (есть ли поддержка MCP).
        - docsUrl: Ссылка на сайт (напр. https://...).
        - pros: Список из 3 преимуществ.
        - features: Список [{title, description}] из 3 фишек.

        ОТВЕЧАЙ ТОЛЬКО JSON БЕЗ ЛИШНЕГО ТЕКСТА.`;

        // Используем модель с выходом в интернет для исключения галлюцинаций
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-scout.vercel.app',
            },
            body: JSON.stringify({
                model: 'perplexity/sonar-reasoning', // Эта модель ищет в интернете в реальном времени
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) throw new Error(`AI fail: ${response.status}`);
        const data = await response.json();
        const result = JSON.parse(data.choices[0]?.message?.content || '{}');

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Enrichment failed:', error);
        return res.status(500).json({ error: error.message });
    }
}
