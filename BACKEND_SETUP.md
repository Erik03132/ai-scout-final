# Backend Setup Guide / Руководство по настройке бэкенда

## Что создано

### 1. Database Schema (`supabase/schema.sql`)
SQL схема для Supabase с таблицами:
- `tools` - Программы/Инструменты
- `channels` - Каналы для мониторинга
- `posts` - Новости/Посты
- `tool_details` - Детали инструментов
- `favorites` - Избранное пользователей
- `telegram_messages` - Сообщения из Telegram
- `cron_logs` - Логи запусков крон-задач

### 2. Edge Functions
- `fetch-youtube` - Сбор видео с YouTube каналов
- `analyze-post` - AI-анализ постов с использованием Gemini
- `telegram-webhook` - Обработка сообщений Telegram бота

### 3. Cron Jobs (Автоматический сбор)

#### Vercel Cron Jobs (`vercel.json`)
| Задача | Расписание | Описание |
|--------|------------|----------|
| `fetch-youtube` | `0 */6 * * *` | Каждые 6 часов |
| `analyze-post` | `0 */2 * * *` | Каждые 2 часа |
| `cleanup` | `0 3 * * *` | Ежедневно в 03:00 UTC |

#### pg_cron (Supabase)
После выполнения SQL схемы в Supabase автоматически создаются задачи:
- `fetch-youtube-videos` - каждые 6 часов
- `analyze-posts` - каждые 2 часа
- `cleanup-old-messages` - ежедневно в 03:00 UTC

### 4. Квоты API

| API | Квота | Безопасный лимит |
|-----|-------|------------------|
| YouTube Data API v3 | 10,000 units/day | 4 запуска/день по 100 units |
| Telegram Bot API | 30 msg/sec | Без ограничений для webhook |
| Gemini API | 60 req/min | 1 запрос каждые 2 секунды |

---

## Инструкция по развёртыванию

### Шаг 1: Настройка Supabase

1. Создайте проект на [supabase.com](https://supabase.com)
2. Перейдите в SQL Editor
3. Скопируйте содержимое `supabase/schema.sql` и выполните

### Шаг 2: Настройка переменных окружения

Добавьте в `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Для Edge Functions
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_admin_chat_id

# AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key
```

### Шаг 3a: Настройка Telegram бота

1. Откройте **@BotFather** в Telegram: https://t.me/BotFather
2. Нажмите **Start** / **Запустить**
3. Отправьте команду `/newbot` для создания нового бота
4. Введите **имя** бота (например: "AI Scout Bot")
5. Введите **username** бота (должен заканчиваться на "bot", например: "aiscout_bot")
6. **BotFather** выдаст токен вида: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
7. Скопируйте токен и сохраните в `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=ваш_токен_бота
   ```

**Получить ваш Chat ID:**
1. Откройте **@userinfobot** в Telegram
2. Нажмите **Start**
3. Бот покажет ваш `ID` - это ваш Chat ID
4. Добавьте в `.env.local`:
   ```
   TELEGRAM_ADMIN_CHAT_ID=ваш_chat_id
   ```

**(Опционально) Настройка команд бота:**
Отправьте BotFather:
```
/setcommands
```
И введите:
```
start - Показать приветствие
search - Поиск AI-инструментов
channels - Список каналов
favorites - Ваше избранное
help - Помощь
```

### Шаг 3b: Деплой Edge Functions

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в аккаунт
supabase login

# Деплой функций
supabase functions deploy fetch-youtube
supabase functions deploy analyze-post
supabase functions deploy telegram-webhook
```

### Шаг 4: Настройка Telegram Webhook

После деплоя функции `telegram-webhook`, установите webhook для бота:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://your-project.supabase.co/functions/v1/telegram-webhook"
```

Проверить статус webhook:
```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

### Шаг 4: Настройка Vercel (для Cron)

1. Деплойте проект на Vercel
2. Добавьте CRON_SECRET в переменные окружения
3. Vercel автоматически подхватит `vercel.json`

---

## Использование

### Ручной запуск сбора

```bash
curl -X POST https://your-project.supabase.co/functions/v1/fetch-youtube \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Ручной запуск анализа

```bash
curl -X POST https://your-project.supabase.co/functions/v1/analyze-post \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

## Notes

- Edge Functions работают на Deno
- Для работы нужен active Supabase проект
- YouTube API имеет квоты - не злоупотребляйте
- AI анализ использует Gemini API

---

## Использование Telegram бота

### Доступные команды:
- `/start` - Приветственное сообщение
- `/search [запрос]` - Поиск AI-инструментов
- `/channels` - Список отслеживаемых каналов
- `/favorites` - Ваше избранное
- `/help` - Справка

### Примеры:
```
/search image generation
/search text to speech
/search coding assistant
```
