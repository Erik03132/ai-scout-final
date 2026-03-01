import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tool name is required' });

    try {
        const prompt = `Ты — эксперт по AI инструментам. Найди актуальную информацию о сервисе/программе "${name}".
        
        Верни СТРОГО JSON со следующими полями на русском языке:
        - description: Краткое, но емкое описание (2-3 предложения).
        - category: Категория (например, "LLM", "Design", "DevTools", "Video AI").
        - icon: Один подходящий эмодзи.
        - dailyCredits: Сколько бесплатных кредитов в день (если нет инфо - напишите "По запросу" или "Н/Д").
        - monthlyCredits: Сколько в месяц.
        - minPrice: Минимальная цена подписки (например, "$20/мес" или "Free").
        - hasApi: boolean (есть ли API).
        - hasMcp: boolean (есть ли поддержка MCP/Claude Desktop).
        - docsUrl: Ссылка на официальный сайт или документацию.
        - pros: Массив из 3 главных преимуществ.
        - features: Массив объектов [{title: "название", description: "суть"}] из 3 ключевых фишек.

        ОТВЕЧАЙ ТОЛЬКО ЧИСТЫМ JSON НА РУССКОМ ЯЗЫКЕ.`;

        // Используем OpenRouter (он сейчас самый стабильный у нас)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ai-scout.vercel.app',
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
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
