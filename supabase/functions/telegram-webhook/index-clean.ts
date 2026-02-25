// Telegram Bot Webhook для AI Scout

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
    };
}

// Отправка сообщения в Telegram
async function sendMessage(chatId: number, text: string, parseMode = 'Markdown') {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
}

// Сохранение сообщения в Supabase
async function saveTelegramMessage(update: TelegramUpdate) {
    if (!update.message) return;
    await fetch(`${SUPABASE_URL}/rest/v1/telegram_messages`, {
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
}

// Обработчик команд
async function handleCommand(chatId: number, text: string) {
    const [cmd, ...args] = text.split(' ');
    const query = args.join(' ');

    switch (cmd.toLowerCase()) {
        case '/start':
            await sendMessage(chatId, `👋 Привет!\n\nЯ AI Scout Bot.\n\nКоманды:\n/search [запрос] - Поиск\n/channels - Каналы\n/favorites - Избранное\n/help - Помощь`);
            break;
        case '/help':
            await sendMessage(chatId, `📖 *Команды:*\n\n/search [запрос] - Поиск AI-инструментов\n/channels - Список каналов\n/favorites - Ваше избранное\n/help - Эта справка`);
            break;
        case '/search':
            if (!query) {
                await sendMessage(chatId, 'Укажите запрос: /search image generation');
                return;
            }
            const searchRes = await fetch(
                `${SUPABASE_URL}/rest/v1/tools?select=*&or=(name.ilike.*${query}*,description.ilike.*${query}*)&limit=5`,
                { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const tools = await searchRes.json();
            if (!tools?.length) {
                await sendMessage(chatId, `🔍 По "${query}" ничего не найдено`);
                return;
            }
            let result = `🔍 *Результаты:*\n\n`;
            tools.forEach((t: any) => { result += `*${t.name}*\n${t.description?.slice(0, 80) || ''}...\n\n`; });
            await sendMessage(chatId, result);
            break;
        case '/channels':
            await sendMessage(chatId, '📢 Каналы скоро появятся');
            break;
        case '/favorites':
            await sendMessage(chatId, '⭐ Избранное скоро появится');
            break;
        default: {
            // Обычный текст = поиск
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/tools?select=*&or=(name.ilike.*${text}*,description.ilike.*${text}*)&limit=5`,
                { headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
            );
            const results = await res.json();
            if (!results?.length) {
                await sendMessage(chatId, `🔍 По "${text}" ничего не найдено. Напишите /help для списка команд.`);
                return;
            }
            let msg = `🔍 *Результаты:*\n\n`;
            results.forEach((t: any) => { msg += `*${t.name}*\n${t.description?.slice(0, 80) || ''}...\n\n`; });
            await sendMessage(chatId, msg);
            break;
        }
    }
}

// Главный обработчик
Deno.serve(async (req) => {
    if (req.method === 'GET') {
        return new Response(JSON.stringify({ ok: true, bot: 'AI Scout Bot' }), { headers: { 'Content-Type': 'application/json' } });
    }
    const update: TelegramUpdate = await req.json();
    if (!update.message) return new Response(JSON.stringify({ ok: true }));

    const chatId = update.message.chat.id;
    const text = update.message.text || '';

    await saveTelegramMessage(update);
    await handleCommand(chatId, text);

    if (TELEGRAM_ADMIN_CHAT_ID && update.message.from) {
        await sendMessage(parseInt(TELEGRAM_ADMIN_CHAT_ID), `📬 От @${update.message.from.username || 'unknown'}: ${text}`);
    }

    return new Response(JSON.stringify({ ok: true }));
});
