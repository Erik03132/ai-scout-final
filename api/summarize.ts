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

// Список известных инструментов для извлечения
const KNOWN_TOOLS = [
    'Vercel', 'Next.js', 'React', 'Vue', 'Angular', 'Svelte',
    'Supabase', 'Prisma', 'PostgreSQL', 'MongoDB', 'Redis',
    'Stripe', 'PayPal',
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
    'VS Code', 'WebStorm', 'Sublime Text',
    'Antigravity', 'OpenClaw', 'NotebookLM'
];

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { content } = req.body as SummarizeRequest;

    if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const result = await generateSummaryWithLLM(content);
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('LLM summarization failed:', error);
        // Добавляем логирование ошибки для диагностики
        const errorDetails = error?.message || (typeof error === 'string' ? error : 'Unknown error');

        const fallbackResult = generateFallbackSummary(content, errorDetails);
        return res.status(200).json(fallbackResult);
    }
}

/**
 * Генерация саммари с помощью LLM (Gemini/OpenAI)
 */
async function generateSummaryWithLLM(content: string): Promise<SummarizeResponse> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error('No LLM API key configured');
    }

    // Приоритет отдаем Gemini API
    if (process.env.GEMINI_API_KEY) {
        try {
            return await callGemini(content);
        } catch (e: any) {
            console.error("Gemini failed:", e.message);
            if (!process.env.OPENAI_API_KEY) throw e;
            // else continue to OpenAI
        }
    }

    // Резервный вариант: OpenAI API
    if (process.env.OPENAI_API_KEY) {
        try {
            return await callOpenAI(content);
        } catch (e: any) {
            console.error("OpenAI failed too:", e.message);
            throw e;
        }
    }

    throw new Error('No LLM provider configured or all providers failed');
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
                    content: `Ты — профессиональный ИИ-аналитик и технологический редактор. Ознакомься с предоставленным контентом.
Твоя задача — составить МАКСИМАЛЬНО ИНФОРМАТИВНЫЙ анализ на РУССКОМ языке.

КРИТИЧЕСКИЕ ТРЕБОВАНИЯ:
1. Весь ответ (заголовок, саммари, подробный разбор, советы) ДОЛЖЕН БЫТЬ НА РУССКОМ ЯЗЫКЕ. 
2. Если исходный текст на английском — ПЕРЕВЕДИ ЕГО на качественный, профессиональный русский язык.
3. Поле "titleRu" — ПЕРЕВЕДИ заголовок на русский. Не оставляй английские слова в заголовке, если есть адекватный перевод.
4. Поле "detailedUsage" — создай ИСЧЕРПЫВАЮЩЕЕ текстовое саммари. Сделай МИНИМУМ 5-7 развернутых абзацев. Разбери все ключевые моменты, этапы и выводы. Используй Markdown для оформления.
5. ИГНОРИРУЙ ссылки, промокоды и призывы подписаться.

JSON СТРУКТУРА:
{
  "titleRu": "Переведенный заголовок на русский",
  "summary": "Краткое саммари (3-4 пред) для превью на русском.",
  "tags": ["AI", "Automation", "Tools"],
  "mentions": ["Tool1", "Tool2"],
  "detailedUsage": "Подробный разбор всего содержания на русском языке. Минимум 5-8 абзацев. Опиши все детали.",
  "usageTips": ["совет 1 на русском", "совет 2 на русском"]
}

Верни ТОЛЬКО чистый JSON без markdown блоков.`
                },
                {
                    role: 'user',
                    content: content.substring(0, 10000)
                }
            ],
            temperature: 0.3,
            max_tokens: 3500
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${err}`);
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
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Ты — ведущий ИИ-аналитик. Твоя задача: сделать глубокий разбор контента на РУССКОМ ЯЗЫКЕ.

КРИТИЧЕСКИЕ ИНСТРУКЦИИ:
1. "titleRu": ОБЯЗАТЕЛЬНО переведи заголовок на качественный русский язык. НИКАКОГО английского в заголовке.
2. "summary": Напиши ПЛОТНОЕ информативное саммари (3-4 длинных предложения) на РУССКОМ ЯЗЫКЕ.
3. "detailedUsage": Сделай МАКСИМАЛЬНО подробный пересказ всего контента на РУССКОМ ЯЗЫКЕ. Опиши все этапы, идеи и выводы в деталях. Минимум 5-8 абзацев с заголовками Markdown (###).
4. "mentions": Извлеки ВСЕ конкретные сервисы/нейросети/модели.
5. ИГНОРИРУЙ общие понятия (AI, LLM) и языки программирования (Python, JS).

JSON СТРУКТУРА:
{
  "titleRu": "Идеальный перевод заголовка на русский",
  "summary": "Краткое, но емкое описание контента на русском языке.",
  "tags": ["AI", "Automation", "Tools"],
  "mentions": ["Tool1", "Tool2"],
  "mentionsDetail": [
    { "name": "Tool1", "category": "AI", "minPrice": "Бесплатно", "hasApi": true, "hasMcp": false }
  ],
  "detailedUsage": "### Основная идея\\n...\\n### Детальный разбор\\n...\\n### Технические особенности\\n...\\n### Заключение\\n...",
  "usageTips": ["Совет 1 на русском", "Совет 2 на русском"]
}

Верни ТОЛЬКО чистый JSON без markdown блоков.

Контент для анализа: ${content.substring(0, 20000)}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Gemini empty response:', JSON.stringify(data));
        throw new Error('Gemini returned empty response (safety filter or quota?)');
    }

    const text = data.candidates[0].content.parts[0].text;
    return parseLLMResponse(text);
}

/**
 * Парсинг ответа LLM
 */
function parseLLMResponse(text: string): SummarizeResponse {
    try {
        let jsonStr = text.trim();

        // Очистка от markdown-блоков если они есть
        if (jsonStr.includes('```')) {
            const match = jsonStr.match(/```json\n?([\s\S]*?)\n?```/) || jsonStr.match(/```\n?([\s\S]*?)\n?```/);
            if (match) {
                jsonStr = match[1];
            }
        }

        // Если все ещё есть мусор вокруг JSON
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const parsed = JSON.parse(jsonStr);

        return {
            titleRu: parsed.titleRu || parsed.title || 'Обновление данных',
            summary: parsed.summary || 'Саммари находится в обработке...',
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
            mentions: Array.isArray(parsed.mentions) ? parsed.mentions : [],
            mentionsDetail: Array.isArray(parsed.mentionsDetail) ? parsed.mentionsDetail : [],
            detailedUsage: parsed.detailedUsage || parsed.detailed_usage || '',
            usageTips: Array.isArray(parsed.usageTips) ? parsed.usageTips : (Array.isArray(parsed.usage_tips) ? parsed.usage_tips : [])
        };
    } catch (e) {
        console.error('Failed to parse LLM response:', e, 'Raw text:', text.substring(0, 200));
        throw new Error('Failed to parse AI response into JSON');
    }
}

/**
 * Fallback генерация саммари без LLM
 */
function generateFallbackSummary(content: string, error?: string): SummarizeResponse {
    let title = '';
    const titleMatch = content.match(/Заголовок:\s*(.*?)\n/);
    if (titleMatch) title = titleMatch[1].trim();

    let displayTitle = title || 'Обновление';

    let summaryMessage = 'ИИ-анализ в очереди или временно недоступен.';
    if (error?.includes('429')) {
        summaryMessage = 'Превышена квота запросов к ИИ. Пожалуйста, попробуйте обновить через минуту.';
    } else if (error?.toLowerCase().includes('empty')) {
        summaryMessage = 'Контент заблокирован фильтрами безопасности или слишком короткий для анализа.';
    }

    const extractedMentions = KNOWN_TOOLS.filter(tool =>
        new RegExp(`\\b${tool}\\b`, 'i').test(content)
    );

    return {
        titleRu: displayTitle,
        summary: summaryMessage,
        tags: ['System'],
        mentions: extractedMentions,
        mentionsDetail: [],
        detailedUsage: `К сожалению, нам не удалось сгенерировать подробный разбор этого контента.\n\nТехническая информация: ${error || 'Нет данных'}\n\nПожалуйста, попробуйте обновить страницу позже или проверьте оригинальный источник.`,
        usageTips: [
            'Проверьте оригинальный источник',
            'Попробуйте обновить страницу позже',
            'Убедитесь, что контент не заблокирован в вашем регионе'
        ]
    };
}
