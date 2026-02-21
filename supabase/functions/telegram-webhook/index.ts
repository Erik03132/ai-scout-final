// Telegram Bot Webhook для AI Scout
// Деплой: supabase functions deploy telegram-webhook

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const TELEGRAM_ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from?: {
            id: number;
            is_bot: boolean;
            first_name?: string;
            username?: string;
        };
        chat: {
            id: number;
            type: string;
        };
        text?: string;
        entities?: Array<{
            type: string;
            offset: number;
            length: number;
        }>;
    };
    callback_query?: {
        id: string;
        from?: {
            id: number;
            username?: string;
        };
        message?: {
            chat: { id: number };
            message_id: number;
        };
        data?: string;
    };
}

// Отправка сообщения в Telegram
async function sendMessage(chatId: number, text: string, parseMode = 'Markdown') {
    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: parseMode,
            }),
        }
    );
    return response.json();
}

// Отправка inline клавиатуры
async function sendMessageWithKeyboard(
    chatId: number,
    text: string,
    keyboard: Array<Array<{ text: string; callback_data: string }>>
) {
    const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                reply_markup: {
                    inline_keyboard: keyboard,
                },
            }),
        }
    );
    return response.json();
}

// Сохранение сообщения в Supabase
async function saveTelegramMessage(update: TelegramUpdate) {
    if (!update.message) return null;

    const { data, error } = await fetch(`${SUPABASE_URL}/rest/v1/telegram_messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
            telegram_id: update.message.message_id,
            chat_id: update.message.chat.id,
            user_id: update.message.from?.id,
            username: update.message.from?.username,
            first_name: update.message.from?.first_name,
            text: update.message.text,
            created_at: new Date().toISOString(),
        }),
    });

    if (error) {
        console.error('Error saving message:', error);
    }
    return data;
}

// Обработка команды /start
async function handleStart(chatId: number, firstName?: string) {
    const welcomeText = `👋 Привет, ${firstName || 'друг'}!

Я *AI Scout Bot* - помогаю искать и анализировать AI-инструменты.

📋 *Доступные команды:*
/start - Показать это сообщение
/search [запрос] - Поиск AI-инструментов
/channels - Список отслеживаемых каналов
/favorites - Ваше избранное
/help - Помощь

🔍 Просто напиши запрос и я найду нужные инструменты!`;

    await sendMessage(chatId, welcomeText);
}

// Обработка команды /help
async function handleHelp(chatId: number) {
    const helpText = `📖 *Справка по AI Scout Bot*

*Основные функции:*
• Поиск AI-инструментов по названию или описанию
• Анализ постов с AI-новостями
• Мониторинг каналов
• Сохранение в избранное

*Как использовать:*
1. Напишите /search followed by ваш запрос
   Пример: /search image generation

2. Подпишитесь на каналы командой /channels

3. Добавляйте инструменты в избранное /favorites

*Поддержка:*
По вопросам пишите @admin`;

    await sendMessage(chatId, helpText);
}

// Обработка команды /search
async function handleSearch(chatId: number, query: string) {
    if (!query.trim()) {
        await sendMessage(chatId, 'Пожалуйста, укажите запрос для поиска.\nПример: /search image generation');
        return;
    }

    // Поиск в Supabase
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/tools?select=*&or=(name.ilike.*${query}*,description.ilike.*${query}*)&limit=10`,
        {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
        }
    );

    const tools = await response.json();

    if (!tools || tools.length === 0) {
        await sendMessage(chatId, `🔍 По запросу "${query}" ничего не найдено.`);
        return;
    }

    let resultText = `🔍 *Результаты поиска:*\n\n`;

    for (const tool of tools.slice(0, 5)) {
        resultText += `*${tool.name}*\n${tool.description?.substring(0, 100) || 'Нет описания'}...\n\n`;
    }

    if (tools.length > 5) {
        resultText += `_Показано 5 из ${tools.length} результатов_`;
    }

    await sendMessage(chatId, resultText);
}

// Обработка команды /channels
async function handleChannels(chatId: number) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/channels?select=*&limit=20`,
        {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
        }
    );

    const channels = await response.json();

    if (!channels || channels.length === 0) {
        await sendMessage(chatId, 'Пока нет отслеживаемых каналов.');
        return;
    }

    let text = '📢 *Отслеживаемые каналы:*\n\n';
    for (const ch of channels) {
        text += `• ${ch.name} (${ch.platform})\n`;
    }

    await sendMessage(chatId, text);
}

// Обработка команды /favorites
async function handleFavorites(chatId: number) {
    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/favorites?select=tools(name,description)&chat_id=eq.${chatId}&limit=10`,
        {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
        }
    );

    const favorites = await response.json();

    if (!favorites || favorites.length === 0) {
        await sendMessage(chatId, 'У вас пока нет избранного. Добавьте инструменты командой /search');
        return;
    }

    let text = '⭐ *Ваше избранное:*\n\n';
    for (const fav of favorites) {
        if (fav.tools) {
            text += `*${fav.tools.name}*\n${fav.tools.description?.substring(0, 80) || ''}...\n\n`;
        }
    }

    await sendMessage(chatId, text);
}

// Обработка текстовых сообщений
async function handleTextMessage(chatId: number, text: string) {
    // Проверяем, начинается ли сообщение с команды
    if (text.startsWith('/')) {
        const [command, ...args] = text.split(' ');
        const query = args.join(' ');

        switch (command.toLowerCase()) {
            case '/start':
                return handleStart(chatId);
            case '/help':
                return handleHelp(chatId);
            case '/search':
                return handleSearch(chatId, query);
            case '/channels':
                return handleChannels(chatId);
            case '/favorites':
                return handleFavorites(chatId);
            default:
                return sendMessage(chatId, 'Неизвестная команда. Напишите /help для списка команд.');
        }
    }

    // Обычный текст - выполняем поиск
    return handleSearch(chatId, text);
}

// Главный обработчик
Deno.serve(async (req) => {
    try {
        // Проверка webhook токена для безопасности
        const url = new URL(req.url);
        const secret = url.searchParams.get('secret');

        if (secret !== Deno.env.get('CRON_SECRET')) {
            // Для реального webhook нужно добавить проверку
        }

        if (req.method === 'GET') {
            return new Response(JSON.stringify({
                status: 'ok',
                message: 'Telegram Webhook is running',
                bot_token_set: !!TELEGRAM_BOT_TOKEN,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (req.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const update: TelegramUpdate = await req.json();

        if (!update.message) {
            return new Response(JSON.stringify({ ok: true }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const chatId = update.message.chat.id;
        const text = update.message.text || '';

        // Сохраняем сообщение в БД
        await saveTelegramMessage(update);

        // Обрабатываем сообщение
        await handleTextMessage(chatId, text);

        // Уведомляем админа о новом сообщении (если настроено)
        if (TELEGRAM_ADMIN_CHAT_ID && update.message.from) {
            const adminText = `📬 *Новое сообщение от* ${update.message.from.first_name || 'User'} (@${update.message.from.username || 'unknown'}):\n\n${text}`;
            await sendMessage(parseInt(TELEGRAM_ADMIN_CHAT_ID), adminText);
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error processing update:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
