/**
 * Vercel Serverless Function: Telegram Latest Post
 * Endpoint: GET /api/telegram-latest?channel={nameOrLink}
 *
 * Получает последний пост из Telegram канала
 * Использует Telegram Bot API
 *
 * ⚠️ ЛИМИТЫ VERCEL CRON JOBS (Hobby Plan):
 * - Максимум 1 запуск в день (Daily execution limit)
 * - Schedule выражения типа "0 * * * *" (каждый час) НЕ работают
 * - Используйте только ежедневное расписание: "0 6 * * *" (в 06:00 UTC)
 *
 * Для более частых обновлений требуется Pro план или альтернативное решение:
 * - Supabase Edge Functions + pg_cron (без ограничений)
 * - Внешний cron-сервис (cron-job.org, EasyCron)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60; // Set max duration for Hobby plan limit

interface TelegramPost {
    title: string | null;
    text: string;
    summary: string;
    link: string;
    date: string;
}

interface TelegramUpdatesResponse {
    ok: boolean;
    result: Array<{
        update_id: number;
        channel_post?: {
            message_id: number;
            chat: {
                id: number;
                title?: string;
                username?: string;
            };
            date: number;
            text?: string;
            caption?: string;
        };
    }>;
}

interface TelegramChatResponse {
    ok: boolean;
    result: {
        id: number;
        title?: string;
        username?: string;
    };
}

interface TelegramMessagesResponse {
    ok: boolean;
    result: Array<{
        message_id: number;
        date: number;
        text?: string;
        caption?: string;
    }>;
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Проверка метода
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { channel } = req.query;

    if (!channel || typeof channel !== 'string') {
        return res.status(400).json({ error: 'Channel parameter is required' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        return res.status(500).json({ error: 'Telegram bot token not configured' });
    }

    try {
        const post = await getLatestPost(channel, botToken);
        return res.status(200).json(post);
    } catch (error) {
        console.error('Error fetching Telegram post:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch post'
        });
    }
}

/**
 * Получить последний пост из канала
 */
async function getLatestPost(channel: string, _botToken: string): Promise<TelegramPost> {
    // Нормализуем имя канала
    const channelUsername = channel.replace('@', '').replace('https://t.me/s/', '').replace('https://t.me/', '').trim();

    // Используем ПУБЛИЧНЫЙ веб-предпросмотр Telegram (t.me/s/username)
    // Этот метод не требует API ключей и прав админа
    const previewUrl = `https://t.me/s/${channelUsername}`;

    try {
        const response = await fetch(previewUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch channel page: ${response.status}`);
        }

        const html = await response.text();

        // Извлекаем сообщения через регулярные выражения
        // Каждое сообщение находится в блоке с классом tgme_widget_message
        const messageBlocks = html.split('tgme_widget_message_wrap').reverse(); // Берем с конца (последние)

        let latestPost: TelegramPost | null = null;

        for (const block of messageBlocks) {
            // Ищем текст сообщения
            const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
            if (!textMatch) continue;

            const rawText = textMatch[1]
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<[^>]+>/g, '') // Очистка от HTML тегов
                .trim();

            if (!rawText || rawText.length < 5) continue;

            // Ищем ссылку на сообщение
            const linkMatch = block.match(/href="(https:\/\/t\.me\/[^"]+\/\d+)"/);
            const link = linkMatch ? linkMatch[1] : `https://t.me/${channelUsername}`;

            // Ищем дату
            const dateMatch = block.match(/datetime="([^"]+)"/);
            const date = dateMatch ? dateMatch[1] : new Date().toISOString();

            latestPost = {
                title: extractTitle(rawText),
                text: rawText,
                summary: await generateSummary(rawText),
                link,
                date
            };
            break; // Нашли самый свежий пост с текстом
        }

        if (!latestPost) {
            throw new Error('No posts with text found in this channel');
        }

        return latestPost;
    } catch (error) {
        console.error('Web parsing failed, falling back to bot API or stub:', error);
        throw error;
    }
}

/**
 * Извлечь заголовок из текста поста
 */
function extractTitle(text: string): string | null {
    if (!text) return null;

    // Пытаемся найти заголовок в первой строке
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) return null;

    const firstLine = lines[0].trim();

    // Если первая строка слишком длинная, обрезаем
    if (firstLine.length > 100) {
        return firstLine.substring(0, 100) + '...';
    }

    // Если первая строка выглядит как заголовок (не ссылка, не эмодзи)
    if (firstLine.startsWith('http') || firstLine.startsWith('@')) {
        return null;
    }

    return firstLine;
}

/**
 * Генерация саммари через Gemini API
 */
async function generateSummary(text: string): Promise<string> {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        return createFallbackSummary(text);
    }

    try {
        const content = text.substring(0, 4000);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Ты — редактор новостей. Напиши краткое саммари (1-2 предложения) на РУССКОМ языке про этот пост. 
Очень важно: ИГНОРИРУЙ любые технические ссылки (t.me, http, me/...), промокоды, призывы подписаться на канал, таймкоды и прочий мусор. Возвращай ТОЛЬКО СУТЬ самого контента.
Без ссылок, без url, без эмодзи.
Верни ТОЛЬКО текст саммари без JSON и без markdown.

Текст: ${content}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 200
                    }
                })
            }
        );

        if (!response.ok) {
            return createFallbackSummary(text);
        }

        const data = await response.json();
        const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return summary.trim() || createFallbackSummary(text);
    } catch (error) {
        console.error('Gemini summarization failed:', error);
        return createFallbackSummary(text);
    }
}

/**
 * Fallback генерация саммари
 */
function createFallbackSummary(text: string): string {
    // Фильтруем строки с ссылками и слишком короткие
    const sentences = text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => {
            if (/https?:\/\/|bit\.ly|t\.me/i.test(s)) return false;
            if (s.length < 30) return false;
            return true;
        });

    let summary = sentences[0] || '';
    if (summary.length > 150) {
        summary = summary.substring(0, 150).trim() + '...';
    }

    return summary || 'Описание недоступно';
}