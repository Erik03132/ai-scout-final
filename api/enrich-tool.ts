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
        console.log(`[Backend] Enrichment for: ${name}`);
        const prompt = `Quick facts about AI tool "${name}": 
        1. 1-sentence summary
        2. category
        3. emoji icon
        4. pricing
        5. 3 features. 
        Output clean JSON in Russian.`;

        // Primary: Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1000
                }
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const geminiErr = await response.json().catch(() => ({}));
            console.error(`[Gemini failed] status: ${response.status}`, geminiErr);

            // Fallback to OpenAI if Gemini fails and we have the key
            if (process.env.OPENAI_API_KEY) {
                console.log(`[Backend] Attempting OpenAI fallback for ${name}...`);
                const oaResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    })
                });

                if (oaResponse.ok) {
                    const oaData = await oaResponse.json();
                    const oaResult = JSON.parse(oaData.choices[0]?.message?.content || '{}');
                    oaResult.name = name;
                    return res.status(200).json(oaResult);
                }
            }

            return res.status(response.status).json({
                error: 'AI Provider Error',
                details: geminiErr.error?.message || response.statusText
            });
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const result = JSON.parse(cleanText);
            result.name = name;
            clearTimeout(timeoutId);
            return res.status(200).json(result);
        } catch (parseError) {
            console.error('[Parse Error] Raw text:', cleanText);
            clearTimeout(timeoutId);
            // If JSON fails, return a minimal valid structure with the raw text in description
            return res.status(200).json({
                name,
                category: 'AI Tool',
                description: cleanText.substring(0, 200),
                icon: '✨'
            });
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        const isTimeout = error.name === 'AbortError';
        console.error(`[Internal Error] ${isTimeout ? 'Timeout' : error.message}`);
        return res.status(isTimeout ? 504 : 500).json({
            error: isTimeout ? 'Timeout' : 'Server error',
            details: error.message
        });
    }
}
