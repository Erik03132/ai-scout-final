import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Tool name is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY logic missing' });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 секунд (Vercel Hobby limit ~10s)

    try {
        console.log(`Starting enrichment for: ${name}`);
        const prompt = `Найди ФАКТИЧЕСКУЮ информацию о AI сервисе "${name}".
        Нужны: суть (2 предложения), категория, иконка-эмодзи, цена, лимиты, 3 фишки.
        ОТВЕЧАЙ ТОЛЬКО ЧИСТЫМ JSON на русском.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1
                }
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            const errText = JSON.stringify(errBody);
            console.error(`Gemini Error (${response.status}):`, errText);
            return res.status(response.status).json({
                error: 'AI Provider Error',
                details: errBody.error?.message || response.statusText
            });
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let result = JSON.parse(text);
        result.name = name;
        if (!result.icon || result.icon === '⚙️') result.icon = '✨';

        return res.status(200).json(result);
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('Enrichment error:', error.name === 'AbortError' ? 'Timeout' : error.message);
        return res.status(error.name === 'AbortError' ? 504 : 500).json({
            error: error.name === 'AbortError' ? 'Timeout' : 'Internal error'
        });
    }
}
