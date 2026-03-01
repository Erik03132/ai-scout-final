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
    } catch (error: any) {
        console.error('LLM summarization failed, using fallback:', error);

        // Fallback: простое извлечение информации
        const fallbackResult = generateFallbackSummary(content, error?.message || String(error));
        return res.status(200).json(fallbackResult);
    }
}

/**
 * Генерация саммари с помощью LLM (OpenAI/Gemini)
 */
async function generateSummaryWithLLM(content: string): Promise<SummarizeResponse> {
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasKimi = !!process.env.KIMI_API_KEY;

    if (!hasGemini && !hasOpenAI && !hasOpenRouter && !hasKimi) {
        throw new Error('No LLM API keys configured (Gemini, OpenAI, OpenRouter, or KIMI)');
    }

    let lastError: any = null;

    // 1. Gemini Direct
    if (hasGemini) {
        try {
            return await callGemini(content, 'gemini-1.5-flash');
        } catch (e) {
            console.error("Gemini Direct failed:", e);
            lastError = e;
        }
    }

    // 2. OpenRouter (fallback for Gemini)
    if (hasOpenRouter) {
        try {
            console.log("Attempting OpenRouter...");
            return await callOpenRouter(content);
        } catch (e) {
            console.error("OpenRouter failed:", e);
            lastError = e;
        }
    }

    // 3. OpenAI
    if (hasOpenAI) {
        try {
            return await callOpenAI(content);
        } catch (e) {
            console.error("OpenAI failed:", e);
            lastError = e;
        }
    }

    // 4. Kimi (Moonshot)
    if (hasKimi) {
        try {
            console.log("Attempting Kimi...");
            return await callKimi(content);
        } catch (e) {
            console.error("Kimi failed:", e);
            lastError = e;
        }
    }

    throw lastError || new Error('All 4 LLM providers failed');
}

/**
 * Вызов OpenAI API
 */
async function callOpenAI(content: string): Promise<SummarizeResponse> {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');

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

ИНСТРУКЦИИ (КРИТИЧЕСКИ ВАЖНО):
1. ПЕРЕВЕДИ заголовок контента на русский язык в поле "titleRu".
2. Весь текст в полях "summary", "detailedUsage" и "usageTips" должен быть ТОЛЬКО НА РУССКОМ ЯЗЫКЕ.
3. В "detailedUsage" напиши МИНИМУМ 500 слов. Разбери всё до мелочей, все этапы и ключевые мысли. Это должен быть полноценный экспертный разбор.

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
        throw new Error(`OpenAI error ${response.status}: ${err.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    return parseLLMResponse(text);
}

/**
 * Вызов Gemini API
 */
async function callGemini(content: string, model: string): Promise<SummarizeResponse> {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');

    // Переключаемся на v1beta, так как JSON mode там более стабилен
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
                        text: `Ты — элитный ИИ-аналитик. Составь МАКСИМАЛЬНО подробный и глубокий анализ контента СТРОГО НА РУССКОМ ЯЗЫКЕ.

ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (JSON):
- titleRu: Перевод заголовка на русский.
- summary: Краткая суть (3 предложения).
- detailedUsage: ГИГАНТСКИЙ развернутый текст на ПОЛ-СТРАНИЦЫ (минимум 10 абзацев). Расскажи подробно о каждом пункте.
- mentions: Список ИИ-тулзов.
- usageTips: 5 советов по применению.

ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ. ВЕРНИ ТОЛЬКО JSON.

Контент: ${content.substring(0, 10000)}`
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
        throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return parseLLMResponse(text);
}

/**
 * Вызов OpenRouter API
 */
async function callOpenRouter(content: string): Promise<SummarizeResponse> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-scout.vercel.app',
        },
        body: JSON.stringify({
            model: 'google/gemini-flash-1.5-exp',
            messages: [{
                role: 'system',
                content: 'Ты — элитный аналитик на русском языке. Верни JSON с полями: titleRu, summary, detailedUsage (минимум 10 абзацев), mentions, usageTips.'
            }, {
                role: 'user',
                content: content
            }],
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) throw new Error(`OpenRouter error ${response.status}`);
    const data = await response.json();
    return parseLLMResponse(data.choices[0]?.message?.content || '');
}

/**
 * Вызов Kimi (Moonshot) API
 */
async function callKimi(content: string): Promise<SummarizeResponse> {
    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'moonshot-v1-8k',
            messages: [{
                role: 'system',
                content: 'Ты — эксперт по AI. Сделай глубокий разбор на русском в формате JSON (titleRu, summary, detailedUsage, mentions, usageTips). "detailedUsage" должен быть максимально длинным.'
            }, {
                role: 'user',
                content: content
            }]
        })
    });

    if (!response.ok) throw new Error(`Kimi error ${response.status}`);
    const data = await response.json();
    return parseLLMResponse(data.choices[0]?.message?.content || '');
}

/**
 * Парсинг ответа LLM
 */
function parseLLMResponse(text: string): SummarizeResponse {
    try {
        let jsonStr = text;
        const match = text.match(/\{[\s\S]*\}/);
        if (match) jsonStr = match[0];

        const parsed = JSON.parse(jsonStr.trim());

        // Базовая валидация полей
        if (!parsed.titleRu || !parsed.detailedUsage) {
            console.warn("LLM response missing vital fields, retrying fallback values");
        }

        return {
            titleRu: parsed.titleRu || '',
            summary: parsed.summary || '',
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
            mentions: Array.isArray(parsed.mentions) ? parsed.mentions : [],
            detailedUsage: parsed.detailedUsage || '',
            usageTips: Array.isArray(parsed.usageTips) ? parsed.usageTips : []
        };
    } catch (e) {
        console.error("JSON parse error:", e, "Raw text:", text.substring(0, 200));
        throw new Error('Failed to parse LLM response');
    }
}

/**
 * Fallback генерация саммари без LLM
 */
function generateFallbackSummary(content: string, errorMessage?: string): SummarizeResponse {
    const tags = KNOWN_TAGS.filter(tag => content.toLowerCase().includes(tag.toLowerCase())).slice(0, 3);
    const mentions = KNOWN_TOOLS.filter(tool => content.toLowerCase().includes(tool.toLowerCase())).slice(0, 5);

    let rawTitle = 'Новый ИИ-проект';
    const titleMatch = content.match(/Заголовок:\s*(.*?)\n/);
    if (titleMatch) rawTitle = titleMatch[1].trim();

    return {
        titleRu: rawTitle,
        summary: 'Краткое описание временно недоступно из-за ошибки лимитов ИИ.',
        tags: tags.length > 0 ? tags : ['AI'],
        mentions,
        detailedUsage: `⚠️ ОШИБКА АНАЛИЗА: Мы не смогли подключиться к нейросети (Gemini/OpenAI).

ТЕХНИЧЕСКАЯ ОШИБКА:
${errorMessage || 'Неизвестная ошибка'}
        
Это может произойти, если:
1. Вы не добавили ключи GEMINI_API_KEY или OPENAI_API_KEY в переменные окружения Vercel.
2. У вашего аккаунта закончились бесплатные лимиты (Google или OpenAI).
3. Произошел сбой в работе API.

СТАТУС КЛЮЧЕЙ (ДЛЯ ВАС):
- Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ УСТАНОВЛЕН' : '❌ ОТСУТСТВУЕТ'}
- OpenRouter Key: ${process.env.OPENROUTER_API_KEY ? '✅ УСТАНОВЛЕН' : '❌ ОТСУТСТВУЕТ'}
- OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ УСТАНОВЛЕН' : '❌ ОТСУТСТВУЕТ'}
- Kimi API Key: ${process.env.KIMI_API_KEY ? '✅ УСТАНОВЛЕН' : '❌ ОТСУТСТВУЕТ'}

ИНСТРУКЦИЯ:
Зайдите в панель управления Vercel -> Settings -> Environment Variables. Добавьте эти ключи. Затем сделайте "Redeploy" в разделе Deployments.`,
        usageTips: ["Добавьте OPENROUTER_API_KEY", "Проверьте заголовок", "Используйте GPT-4 как альтернативу"]
    };
}
