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
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (!hasGemini && !hasOpenAI) {
        throw new Error('No LLM API keys configured');
    }

    let lastError: any = null;

    // ПЕРВАЯ ПОПЫТКА: Gemini 1.5 Flash (самая быстрая и дешевая)
    if (hasGemini) {
        try {
            console.log("Attempting Gemini 1.5 Flash...");
            return await callGemini(content, 'gemini-1.5-flash');
        } catch (e) {
            console.error("Gemini Flash failed:", e);
            lastError = e;
        }
    }

    // ВТОРАЯ ПОПЫТКА: OpenAI GPT-4o-mini (самая надежная)
    if (hasOpenAI) {
        try {
            console.log("Attempting OpenAI GPT-4o-mini...");
            return await callOpenAI(content);
        } catch (e) {
            console.error("OpenAI failed:", e);
            lastError = e;
        }
    }

    // ТРЕТЬЯ ПОПЫТКА: Gemini 1.5 Pro (если флеш упал по лимитам, про может сработать)
    if (hasGemini) {
        try {
            console.log("Attempting Gemini 1.5 Pro as last resort...");
            return await callGemini(content, 'gemini-1.5-pro');
        } catch (e) {
            console.error("Gemini Pro failed:", e);
            lastError = e;
        }
    }

    throw lastError || new Error('All LLM providers failed');
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
                    content: `Ты — элитный ИИ-аналитик. Твоя цель: трансформировать сырой контент в идеальный структурированный отчет СТРОГО НА РУССКОМ ЯЗЫКЕ.

ИНСТРУКЦИИ ПО ЯЗЫКУ (КРИТИЧЕСКИ ВАЖНО):
1. ПЕРЕВЕДИ заголовок контента на русский язык в поле "titleRu". Это ОБЯЗАТЕЛЬНО.
2. Весь текст в полях "summary", "detailedUsage" и "usageTips" должен быть ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
3. Используй профессиональный, но доступный стиль.

СТРУКТУРА ОТВЕТА (JSON):
- "titleRu": Переведенный заголовок.
- "summary": Краткая суть (2-3 предложения).
- "tags": Массив тематических тегов (на русском).
- "mentions": Массив названий ИИ-сервисов (латиницей, как в оригинале).
- "detailedUsage": Глубокий анализ. Минимум 5-7 содержательных абзацев. Расскажи обо ВСЕМ важном.
- "usageTips": 3-5 конкретных совета по применению.

ПРАВИЛА ОТБОРА МЕНШЕНОВ:
Извлекай ТОЛЬКО названия ИИ-приложений (например, Midjourney, Jasper). Игнорируй языки программирования (Python, React), общие термины (API, LLM) и должности (Backend Developer).

ВЕРНИ ТОЛЬКО ЧИСТЫЙ JSON.`
                },
                {
                    role: 'user',
                    content: content.substring(0, 10000)
                }
            ],
            temperature: 0.3,
            max_tokens: 3000
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    return parseLLMResponse(text);
}

/**
 * Вызов Gemini API
 */
async function callGemini(content: string, model: string): Promise<SummarizeResponse> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Ты — элитный ИИ-аналитик. Твоя цель: трансформировать сырой контент в идеальный структурированный отчет СТРОГО НА РУССКОМ ЯЗЫКЕ.

ИНСТРУКЦИИ ПО ЯЗЫКУ (КРИТИЧЕСКИ ВАЖНО):
1. ПЕРЕВЕДИ заголовок контента на русский язык в поле "titleRu". Это ОБЯЗАТЕЛЬНО.
2. Весь текст в полях "summary", "detailedUsage" и "usageTips" должен быть ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
3. Используй профессиональный, но доступный стиль.

СТРУКТУРА ОТВЕТА (JSON):
{
  "titleRu": "ПЕРЕВЕДЕННЫЙ ЗАГОЛОВОК",
  "summary": "КРАТКАЯ СУТЬ НА РУССКОМ",
  "tags": ["тег1", "тег2"],
  "mentions": ["Сервис1", "Сервис2"],
  "detailedUsage": "ПОДРОБНЫЙ РУССКИЙ ТЕКСТ. Минимум 500 слов. Разбери всё до мелочей.",
  "usageTips": ["совет 1", "совет 2"]
}

Контент для анализа: ${content.substring(0, 10000)}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 3000,
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
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
            titleRu: parsed.titleRu || '',
            summary: parsed.summary || '',
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
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
        titleRu: title || '',
        summary: summary || 'Контент недоступен для саммари',
        tags: tags.length > 0 ? tags : ['Tech'],
        mentions,
        detailedUsage: '⚠️ ИИ-анализ временно недоступен (вероятно, не настроен API-ключ Gemini на Vercel или превышен лимит).\n\nПока вы можете посмотреть оригинальный ролик. В нем, скорее всего, упоминаются следующие инструменты: ' + (mentions.length > 0 ? mentions.join(', ') : 'различные технологии.'),
        usageTips: [
            'Убедитесь, что GEMINI_API_KEY добавлен в панель Vercel',
            'Проверьте лимиты вашего ИИ-провайдера',
            'Следите за обновлениями системы'
        ]
    };
}
