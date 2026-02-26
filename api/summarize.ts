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
        // Пытаемся использовать LLM API
        const result = await generateSummaryWithLLM(content);
        return res.status(200).json(result);
    } catch (error) {
        console.error('LLM summarization failed, using fallback:', error);

        // Fallback: простое извлечение информации
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

    // Используем OpenAI API
    if (process.env.OPENAI_API_KEY) {
        return await callOpenAI(content);
    }

    // Используем Gemini API
    if (process.env.GEMINI_API_KEY) {
        return await callGemini(content);
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
                    content: `Ты — редактор новостей. Прочитай текст и напиши краткое саммари (1-2 предложения) на РУССКОМ языке. 
Без ссылок, без url, без эмодзи. Только суть: о чём контент.
Верни ТОЛЬКО JSON без markdown:
{
  "summary": "1-2 предложения на русском",
  "tags": ["тег1", "тег2"],
  "mentions": ["инструмент1"],
  "detailedUsage": "2-3 предложения на русском о применении",
  "usageTips": ["совет 1", "совет 2", "совет 3"]
}`
                },
                {
                    role: 'user',
                    content: content.substring(0, 4000) // Ограничение длины
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
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
                        text: `Ты — ИИ-аналитик и технологический редактор. Ознакомься с предоставленным контентом (это может быть описание видео на YouTube, статья или пост). 

Твоя задача — извлечь максимум пользы и составить крутое, емкое и структурированное саммари на РУССКОМ языке.
Правила:
1. ИГНОРИРУЙ любые технические ссылки (t.me, http), промокоды, призывы подписаться на канал. Сосредоточься на сути и смысловых блоках.
2. В поле "mentions" ОБЯЗАТЕЛЬНО извлеки ВСЕ названия софта, сервисов, программ, нейросетей, платформ и приложений (например: Figma, Spline, Midjourney, Canva, Notion, ChatGPT, Vercel, YouTube, Telegram и др.). СТРОГО ИСКЛЮЧИ обычные языки программирования и базовые веб-фреймворки (НЕ ПИШИ React, Python, Go, Java, Next.js, Vite, Tailwind, HTML, CSS и т.д.). Нас интересует софт и готовые продукты.
3. Если в тексте есть таймкоды (Stamps, Эпизоды) — проанализируй их названия, чтобы понять структуру материала и включить смысловые блоки в "detailedUsage".

Верни ТОЛЬКО валидный JSON без markdown и блоков кода (никаких \`\`\`json):
{
  "summary": "Глубокое, вовлекающее саммари (3-4 предложения). Раскрой главную суть, о чем это, и чем это полезно для пользователя. Опирайся на заголовок и контент.",
  "tags": ["тег1", "тег2"],
  "mentions": ["инструмент1", "инструмент2"],
  "detailedUsage": "Развернутый аналитический обзор контента (4-6 емких предложений). Выдели главную идею, решаемую проблему и предложенную архитектуру или подход. Обязательно отрази содержание по смысловым блокам или этапам (из таймкодов, если они есть). Возвращай сплошной текст с абзацами (через \\n), без Markdown.",
  "usageTips": ["Практичный и конкретный совет 1 (основанный на тексте)", "Практичный совет 2", "Практичный совет 3", "Практичный совет 4", "Практичный совет 5"]
}

Контент: ${content.substring(0, 5000)}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseLLMResponse(text);
}

/**
 * Парсинг ответа LLM
 */
function parseLLMResponse(text: string): SummarizeResponse {
    try {
        let jsonStr = text;
        // Извлекаем JSON из текста с помощью регулярного выражения
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            jsonStr = match[0];
        }

        const parsed = JSON.parse(jsonStr.trim());

        return {
            summary: parsed.summary || '',
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
            mentions: Array.isArray(parsed.mentions) ? parsed.mentions : [],
            detailedUsage: parsed.detailedUsage || '',
            usageTips: Array.isArray(parsed.usageTips) ? parsed.usageTips : []
        };
    } catch {
        throw new Error('Failed to parse LLM response');
    }
}

/**
 * Fallback генерация саммари без LLM
 */
function generateFallbackSummary(content: string): SummarizeResponse {
    // Извлекаем упоминания известных инструментов
    const mentions = KNOWN_TOOLS.filter(tool =>
        content.toLowerCase().includes(tool.toLowerCase())
    ).slice(0, 5);

    // Извлекаем теги
    const tags = KNOWN_TAGS.filter(tag =>
        content.toLowerCase().includes(tag.toLowerCase())
    ).slice(0, 3);

    // Создаём саммари: фильтруем строки с ссылками и слишком короткие
    const sentences = content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => {
            // Пропускаем строки с ссылками
            if (/https?:\/\/|bit\.ly|t\.me/i.test(s)) return false;
            // Пропускаем слишком короткие строки
            if (s.length < 30) return false;
            return true;
        });

    // Пытаемся вытащить заголовок из формата "Заголовок: ...\n\nОписание: "
    let title = '';
    const titleMatch = content.match(/Заголовок:\s*(.*?)\n/);
    if (titleMatch) title = titleMatch[1].trim();

    // Берём первое нормальное предложение и обрезаем до 150 символов
    let summary = title || sentences[0] || '';
    if (summary.length > 200) {
        summary = summary.substring(0, 200).trim() + '...';
    }

    return {
        summary: summary || 'Контент недоступен для саммари',
        tags: tags.length > 0 ? tags : ['Tech'],
        mentions,
        detailedUsage: mentions.length > 0
            ? `В контенте рассматривается использование ${mentions.join(', ')}.`
            : '',
        usageTips: [
            'Изучите официальную документацию',
            'Попробуйте на практике',
            'Следите за обновлениями'
        ]
    };
}
