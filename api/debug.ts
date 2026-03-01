import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 30;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const keys = {
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
        KIMI_API_KEY: !!process.env.KIMI_API_KEY,
    };

    const results: any = { keys };

    // Тест ключа OpenRouter (который вы прислали)
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
                    model: 'google/gemini-flash-1.5-exp',
                    messages: [{ role: 'user', content: 'Say OK' }],
                    max_tokens: 10
                })
            });
            results.openrouter_test = resp.ok ? `✅ OK (${Date.now() - start}ms)` : `❌ Error ${resp.status}`;
        } catch (e: any) {
            results.openrouter_test = `❌ Failed: ${e.message}`;
        }
    }

    // Тест ключа Kimi (Moonshot)
    if (process.env.KIMI_API_KEY) {
        try {
            const start = Date.now();
            const resp = await fetch('https://api.moonshot.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'moonshot-v1-8k',
                    messages: [{ role: 'user', content: 'Say OK' }],
                    max_tokens: 10
                })
            });
            results.kimi_test = resp.ok ? `✅ OK (${Date.now() - start}ms)` : `❌ Error ${resp.status}`;
        } catch (e: any) {
            results.kimi_test = `❌ Failed: ${e.message}`;
        }
    }

    return res.status(200).json(results);
}
