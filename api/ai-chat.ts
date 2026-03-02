import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, model } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://ai-scout.vercel.app',
                'X-Title': 'AI Scout Search'
            },
            body: JSON.stringify({
                model: model || 'perplexity/llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'Ты — элитный технологический аналитик и AI-эксперт. Отвечай на русском языке. Будь точен, лаконичен и предоставляй только актуальную информацию по инструментам и трендам.'
                    },
                    { role: 'user', content: query }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`OpenRouter API error: ${response.status} ${errBody}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || 'Не удалось получить ответ от ИИ.';

        return res.status(200).json({ text });
    } catch (error: any) {
        console.error('[AI Chat Error]:', error.message);
        return res.status(500).json({ error: 'Failed to get AI response', details: error.message });
    }
}
