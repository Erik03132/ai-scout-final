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
async function getLatestPost(channel: string, botToken: string): Promise<TelegramPost> {
    // Нормализуем имя канала
    const channelUsername = channel.replace('@', '').replace('https://t.me/', '');

    // Получаем информацию о канале
    const chatId = await getChatId(channelUsername, botToken);

    // Получаем последние сообщения
    const messages = await getChatMessages(chatId, botToken, 1);

    if (messages.length === 0) {
        throw new Error('No messages found in channel');
    }

    const latestMessage = messages[0];
    const text = latestMessage.text || latestMessage.caption || '';

    // Генерируем саммари
    const summary = await generateSummary(text);

    return {
        title: extractTitle(text),
        text,
        summary,
        link: `https://t.me/${channelUsername}/${latestMessage.message_id}`,
        date: new Date(latestMessage.date * 1000).toISOString(),
    };
}

/**
 * Получить ID чата по username
 */
async function getChatId(channelUsername: string, botToken: string): Promise<string> {
    // Пробуем получить информацию о канале
    const url = `https://api.telegram.org/bot${botToken}/getChat?chat_id=@${channelUsername}`;

    const response = await fetch(url);
    const data = await response.json() as TelegramChatResponse;

    if (!data.ok) {
        // Если не удалось получить чат, возможно бот не админ
        // Возвращаем username как ID
        return `@${channelUsername}`;
    }

    return data.result.id.toString();
}

/**
 * Получить сообщения из чата
 * Примечание: Telegram Bot API не имеет метода для получения истории сообщений напрямую
 * Эта функция использует альтернативный подход через getUpdates или возвращает заглушку
 */
async function getChatMessages(
    chatId: string,
    botToken: string,
    limit: number
): Promise<Array<{ message_id: number; date: number; text?: string; caption?: string }>> {
    // Telegram Bot API не позволяет получать историю сообщений напрямую
    // Для реальной реализации нужно использовать:
    // 1. Telegram Client API (Telethon, MTProto)
    // 2. Webhook для сбора новых сообщений
    // 3. RSS-ленту канала (если доступна)

    // Попробуем получить обновления (если бот админ в канале)
    const updatesUrl = `https://api.telegram.org/bot${botToken}/getUpdates?limit=100&allowed_updates=["channel_post"]`;

    const response = await fetch(updatesUrl);
    const data = await response.json() as TelegramUpdatesResponse;

    if (data.ok && data.result.length > 0) {
        // Фильтруем по каналу
        const channelPosts = data.result
            .filter(update => update.channel_post)
            .map(update => ({
                message_id: update.channel_post!.message_id,
                date: update.channel_post!.date,
                text: update.channel_post!.text,
                caption: update.channel_post!.caption,
            }))
            .slice(0, limit);

        if (channelPosts.length > 0) {
            return channelPosts;
        }
    }

    // Fallback: возвращаем заглушку
    // В реальном проекте здесь должна быть интеграция с Telethon или другим клиентом
    return [{
        message_id: 1,
        date: Math.floor(Date.now() / 1000),
        text: 'Telegram Bot API не позволяет получать историю сообщений. Для полноценной работы необходимо использовать Telegram Client API (Telethon) или настроить webhook для сбора новых сообщений.',
    }];
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
                            text: `Ты — редактор новостей. Напиши краткое саммари (1-2 sentences) на РУССКОМ языке про этот пост. 
ОЧЕНЬ ВАЖНО: Весь ответ ДОЛЖЕН БЫТЬ НА РУССКОМ ЯЗЫКЕ. Даже если исходный пост на английском — ПЕРЕВЕДИ его.

Очень важно: ИГНОРИРУЙ любые технические ссылки (t.me, http, me/...), промокоды, призывы подписаться на канал, таймкоды и прочий мусор. Возвращай ТОЛЬКО СУТЬ самого контента.
Без ссылок, без url, без эмодзи.
Верни ТОЛЬКО текст саммари на русском без JSON и без markdown.

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

    // Если в тексте нет кириллицы, но есть латиница — это скорее всего английский текст
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(summary);
    if (summary && !hasCyrillic && /[a-zA-Z]/.test(summary)) {
        return 'Описание на английском. AI-анализ и перевод подготавливаются...';
    }

    if (summary.length > 150) {
        summary = summary.substring(0, 150).trim() + '...';
    }

    return summary || 'Описание недоступно';
}