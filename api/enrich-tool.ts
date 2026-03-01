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

        // Using standard v1 for stability with gemini-1.5-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error(`[Gemini Error] ${response.status}:`, JSON.stringify(errData));
            return res.status(response.status).json({
                error: 'AI Provider Error',
                details: errData.error?.message || response.statusText
            });
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const result = JSON.parse(cleanText);
            result.name = name;
            return res.status(200).json(result);
        } catch (parseError) {
            console.error('[Parse Error] Raw text:', cleanText);
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
