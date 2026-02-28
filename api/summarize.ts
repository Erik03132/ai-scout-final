/**
 * Vercel Serverless Function: AI Summarization
 * Endpoint: POST /api/summarize
 * 
 * Принимает контент поста и возвращает структурированный JSON:
 * - summary: краткое саммари (2-3 предложения)
 * - tags: список тегов (1-5)
 * - mentions: упомянутые инструменты
 * - detailedUsage: подробное описание использования
 * - usageTips: практические советы
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60; // Set max duration for Hobby plan limit

interface SummarizeRequest {
    content: string;
}

interface SummarizeResponse {
    titleRu: string;
    summary: string;
    tags: string[];
    mentions: string[];
    detailedUsage: string;
    usageTips: string[];
}

// Список известных инструментов для извлечения
const KNOWN_TOOLS = [
    'Vercel', 'Next.js', 'React', 'Vue', 'Angular', 'Svelte',
    'Supabase', 'Prisma', 'PostgreSQL', 'MongoDB', 'Redis',
    'Stripe', 'PayPal', 'Stripe',
    'Zustand', 'Redux', 'MobX', 'Recoil',
    'Figma', 'Sketch', 'Adobe XD',
    'Tailwind CSS', 'CSS Modules', 'Styled Components',
    'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
    'OpenAI', 'Gemini', 'Claude', 'GPT-4', 'ChatGPT',
    'Telegram', 'YouTube', 'Discord', 'Slack',
    'Node.js', 'Express', 'Fastify', 'NestJS',
    'GraphQL', 'REST API', 'tRPC',
    'Git', 'GitHub', 'GitLab', 'Bitbucket',
    'VS Code', 'WebStorm', 'Sublime Text'
];

// Известные теги по категориям
const KNOWN_TAGS = [
    'AI', 'Machine Learning', 'Deep Learning', 'LLM', 'GPT',
    'Frontend', 'Backend', 'Fullstack', 'DevOps', 'Cloud',
    'React', 'Next.js', 'Vue', 'Angular', 'Svelte',
    'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust',
    'API', 'REST', 'GraphQL', 'Database', 'Authentication',
    'Design', 'UI/UX', 'Performance', 'Security', 'Testing',
    'Automation', 'Productivity', 'Tools', 'Tutorial', 'Review'
];

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Проверка метода
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Проверка тела запроса
    const { content } = req.body as SummarizeRequest;

    if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const result = await generateSummaryWithLLM(content);
        return res.status(200).json(result);
    } catch (error) {
        console.error('LLM summarization failed:', error);
        const fallbackResult = generateFallbackSummary(content);
        return res.status(200).json(fallbackResult);
    }
}

/**
 * Генерация саммари с помощью LLM (OpenAI/Gemini)
 */
async function generateSummaryWithLLM(content: string): Promise<SummarizeResponse> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('No LLM API key configured');
    }

    // Приоритет отдаем Gemini API
    if (process.env.GEMINI_API_KEY) {
        try {
            return await callGemini(content);
        } catch (e) {
            console.error("Gemini failed, falling back to OpenAI", e);
            if (!process.env.OPENAI_API_KEY) throw e;
        }
    }

    // Резервный вариант: OpenAI API
    if (process.env.OPENAI_API_KEY) {
        try {
            return await callOpenAI(content);
        } catch (e) {
            console.error("OpenAI failed too", e);
            throw e;
        }
    }

    throw new Error('No LLM provider configured');
}

/**
 * Вызов OpenAI API
 */
async function callOpenAI(content: string): Promise<SummarizeResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Ты — профессиональный ИИ-аналитик и технологический редактор. Ознакомься с предоставленным контентом (описание видео YouTube, статья или пост).
Твоя задача — составить МАКСИМАЛЬНО ИНФОРМАТИВНЫЙ анализ на РУССКОМ языке.
Правила:
1. ИГНОРИРУЙ ссылки, промокоды и призывы подписаться.
2. Поле "titleRu" — ПЕРЕВЕДИ заголовок на русский. Если он уже на русском — оставь как есть.
3. В поле "mentions" — извлеки АБСОЛЮТНО ВСЕ названия софта, проектов, конкретных ИИ-моделей или нейросетей (Figma, Spline, Midjourney, Canva, Notion, ChatGPT, Vercel и т.д.). 
СТРОГО ИГНОРИРУЙ: 
- языки программирования и фреймворки (Python, React, Go и т.д.)
- общие термины, технологии и концепции (AUTOENCODER, NEURAL NETWORK, VAE, LLM, RAG, API, Database и т.д.).
4. В поле "detailedUsage" создай максимально подробное, ИСЧЕРПЫВАЮЩЕЕ текстовое саммари. Напиши столько предложений и абзацев, сколько нужно, чтобы передать ВСЮ суть, все этапы и ключевые пункты контента. Это должно быть полноценным пересказом.
5. В поле "detailedUsage" допускается использование Markdown (списки, выделение жирным), чтобы текст легко читался.
6. Верни ТОЛЬКО JSON без markdown и \`\`\`json.
{
  "titleRu": "Перевод заголовка",
  "summary": "Краткое саммари (2-3 пред) для превью.",
  "tags": ["тег1", "тег2"],
  "mentions": ["Spline", "Figma"],
  "detailedUsage": "ИСЧЕРПЫВАЮЩЕЕ саммари всего ролика/поста. Детальный разбор всех пунктов содержания, главных идей и выводов. Не ограничивай себя в объеме.",
  "usageTips": ["совет 1", "совет 2"]
}`
                },
                {
                    role: 'user',
                    content: content.substring(0, 8000)
                }
            ],
            temperature: 0.4,
            max_tokens: 3000
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    return parseLLMResponse(text);
}

/**
 * Вызов Gemini API
 */
async function callGemini(content: string): Promise<SummarizeResponse> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Ты — профи ИИ-аналитик. Проанализируй контент и верни JSON на РУССКОМ.
Задачи:
1. "titleRu": Переведи заголовок на русский.
2. "mentions": Список софта (Figma, Supabase и т.д.).
3. "mentionsDetail": Тех. детали (name, category, minPrice, hasApi: bool, hasMcp: bool).
4. "detailedUsage": Глубокий пересказ (Markdown разрешен).

JSON:
{
  "titleRu": "...",
  "summary": "...",
  "tags": ["...", "..."],
  "mentions": ["...", "..."],
  "mentionsDetail": [
    { "name": "...", "category": "...", "minPrice": "...", "hasApi": true, "hasMcp": false }
  ],
  "detailedUsage": "...",
  "usageTips": ["...", "..."]
}

Контент: ${content.substring(0, 15000)}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 4000,
                    responseMimeType: "application/json"
                },
                safetySettings: [
                    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
                    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
                    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
                    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
                ]
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error ${response.status}:`, errorText);
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseLLMResponse(text);
}

interface SummarizeResponse {
    titleRu: string;
    summary: string;
    tags: string[];
    mentions: string[];
    mentionsDetail?: Array<{
        name: string;
        category: string;
        minPrice: string;
        hasApi: boolean;
        hasMcp: boolean;
    }>;
    detailedUsage: string;
    usageTips: string[];
}

/**
 * Парсинг ответа LLM
 */
function parseLLMResponse(text: string): SummarizeResponse {
    try {
        let jsonStr = text;
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            jsonStr = match[0];
        }

        const parsed = JSON.parse(jsonStr.trim());

        return {
            titleRu: parsed.titleRu || '',
            summary: parsed.summary || '',
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
            mentions: Array.isArray(parsed.mentions) ? parsed.mentions : [],
            mentionsDetail: Array.isArray(parsed.mentionsDetail) ? parsed.mentionsDetail : [],
            detailedUsage: parsed.detailedUsage || '',
            usageTips: Array.isArray(parsed.usageTips) ? parsed.usageTips : []
        };
    } catch (e) {
        console.error('Failed to parse LLM response:', e);
        throw new Error('Failed to parse LLM response');
    }
}

/**
 * Fallback генерация саммари без LLM
 */
function generateFallbackSummary(content: string): SummarizeResponse {
    // Извлекаем название канала/видео если есть
    let title = '';
    const titleMatch = content.match(/Заголовок:\s*(.*?)\n/);
    if (titleMatch) title = titleMatch[1].trim();

    return {
        titleRu: title || 'Новое обновление',
        summary: 'ИИ-анализ временно недоступен. Вероятно, превышены лимиты API или текст слишком короткий для анализа.',
        tags: ['Tech'],
        mentions: [],
        mentionsDetail: [],
        detailedUsage: 'К сожалению, нам не удалось сгенерировать подробный разбор этого контента. Это может быть связано с техническими ограничениями или отсутствием развернутого описания в источнике.',
        usageTips: [
            'Проверьте оригинальный источник',
            'Попробуйте обновить страницу позже',
            'Убедитесь в правильности настроек API'
        ]
    };
}
