import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const status = {
        keys: {
            GEMINI_API_KEY: geminiKey ? `✅ Установлен (${geminiKey.substring(0, 8)}...)` : '❌ ОТСУТСТВУЕТ',
            OPENAI_API_KEY: openaiKey ? `✅ Установлен (${openaiKey.substring(0, 8)}...)` : '❌ ОТСУТСТВУЕТ',
        },
        geminiTest: null as any,
        openaiTest: null as any,
    };

    // Тестируем Gemini
    if (geminiKey) {
        try {
            const r = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Say "ok" in Russian' }] }],
                        generationConfig: { maxOutputTokens: 10 }
                    })
                }
            );
            const data = await r.json();
            if (r.ok) {
                status.geminiTest = { ok: true, response: data.candidates?.[0]?.content?.parts?.[0]?.text };
            } else {
                status.geminiTest = { ok: false, status: r.status, error: data };
            }
        } catch (e: any) {
            status.geminiTest = { ok: false, error: e.message };
        }
    }

    // Тестируем OpenAI
    if (openaiKey) {
        try {
            const r = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: 'Say "ok"' }],
                    max_tokens: 5
                })
            });
            const data = await r.json();
            if (r.ok) {
                status.openaiTest = { ok: true, response: data.choices?.[0]?.message?.content };
            } else {
                status.openaiTest = { ok: false, status: r.status, error: data };
            }
        } catch (e: any) {
            status.openaiTest = { ok: false, error: e.message };
        }
    }

    return res.status(200).json(status);
}
