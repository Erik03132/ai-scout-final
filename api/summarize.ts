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

import { askAI } from '../src/lib/ai/gemini';

/**
 * Основная логика получения саммари через оркестратор моделей
 */
async function generateSummaryWithLLM(content: string): Promise<SummarizeResponse> {
    const prompt = ` Ты — ведущий ИИ-аналитик. Твоя задача: сделать глубокий разбор контента на РУССКОМ ЯЗЫКЕ.

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

Верни ТОЛЬКО чистый JSON (объект).

Контент для анализа: ${content.substring(0, 20000)}`;

    try {
        const responseText = await askAI(prompt, { json: true });
        return parseLLMResponse(responseText);
    } catch (e: any) {
        console.error("All AI providers in orchestrator failed:", e.message);
        throw e;
    }
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
