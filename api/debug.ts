import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const keys = {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ FOUND' : '❌ MISSING',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ FOUND' : '❌ MISSING',
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? '✅ FOUND' : '❌ MISSING',
        MOONSHOT_API_KEY: process.env.MOONSHOT_API_KEY ? '✅ FOUND' : '❌ MISSING',
    };

    const results: any = { keys };

    // Тест ключа OpenRouter
    if (process.env.OPENROUTER_API_KEY) {
        try {
            const start = Date.now();
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-flash-001',
                    messages: [{ role: 'user', content: 'Say OK' }],
                    max_tokens: 10
                })
            });
            if (resp.ok) {
                results.openrouter_test = `✅ OK (${Date.now() - start}ms)`;
            } else {
                const txt = await resp.text();
                results.openrouter_test = `❌ Error ${resp.status}: ${txt.substring(0, 100)}`;
            }
        } catch (e: any) {
            results.openrouter_test = `❌ Failed: ${e.message}`;
        }
    }

    // Тест ключа Moonshot
    if (process.env.MOONSHOT_API_KEY) {
        try {
            const start = Date.now();
            const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.MOONSHOT_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k',
                    messages: [{ role: 'user', content: 'Say OK' }],
                    max_tokens: 10
                })
            });
            if (resp.ok) {
                results.moonshot_test = `✅ OK (${Date.now() - start}ms)`;
            } else {
                const txt = await resp.text();
                results.moonshot_test = `❌ Error ${resp.status}: ${txt.substring(0, 100)}`;
            }
        } catch (e: any) {
            results.moonshot_test = `❌ Failed: ${e.message}`;
        }
    }

    return res.status(200).json(results);
}
