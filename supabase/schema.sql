-- ============================================
-- AI Scout Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Таблица: tools (Программы/Инструменты)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    rating DECIMAL(2,1) DEFAULT 0,
    daily_credits TEXT,
    monthly_credits TEXT,
    min_price TEXT DEFAULT '$0',
    has_api BOOLEAN DEFAULT false,
    has_mcp BOOLEAN DEFAULT false,
    docs_url TEXT,
    pros TEXT[], -- Массив преимуществ
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для поиска по категории
CREATE INDEX IF NOT EXISTS idx_tools_category ON public.tools(category);

-- RLS политика для чтения
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tools are viewable by everyone" ON public.tools FOR SELECT USING (true);

-- ============================================
-- Таблица: channels (Каналы для мониторинга)
-- ============================================
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('YouTube', 'Telegram')),
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_fetched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для поиска по source
CREATE INDEX IF NOT EXISTS idx_channels_source ON public.channels(source);

-- RLS политика
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channels are viewable by everyone" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Users can insert channels" ON public.channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update channels" ON public.channels FOR UPDATE USING (true);
CREATE POLICY "Users can delete channels" ON public.channels FOR DELETE USING (true);

-- ============================================
-- Таблица: posts (Новости/Посты)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    summary TEXT,
    source TEXT NOT NULL CHECK (source IN ('YouTube', 'Telegram')),
    channel TEXT NOT NULL,
    date TIMESTAMPTZ,
    tags TEXT[],
    mentions TEXT[], -- Массив названий упомянутых инструментов
    views TEXT,
    image TEXT,
    url TEXT NOT NULL UNIQUE,
    detailed_usage TEXT,
    usage_tips TEXT[],
    content TEXT,
    is_analyzed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для поиска
CREATE INDEX IF NOT EXISTS idx_posts_source ON public.posts(source);
CREATE INDEX IF NOT EXISTS idx_posts_channel ON public.posts(channel);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- RLS политика
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update posts" ON public.posts FOR UPDATE USING (true);

-- ============================================
-- Таблица: tool_details (Детали инструментов - фичи, кейсы)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tool_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('detail', 'usecase')),
    complexity TEXT CHECK (complexity IN ('Simple', 'Medium', 'Hard')),
    steps TEXT[], -- Массив шагов для кейсов
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для связки с tool
CREATE INDEX IF NOT EXISTS idx_tool_details_tool_id ON public.tool_details(tool_id);

-- RLS политика
ALTER TABLE public.tool_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tool details are viewable by everyone" ON public.tool_details FOR SELECT USING (true);

-- ============================================
-- Таблица: favorites (Избранное)
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL, -- Идентификатор пользователя (из localStorage или auth)
    item_id TEXT NOT NULL, -- ID поста или инструмента
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'tool')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_id, item_type)
);

-- Индекс для поиска избранного пользователя
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- RLS политика
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON public.favorites FOR ALL USING (true);

-- ============================================
-- Таблица: telegram_messages (Сообщения из Telegram)
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_messages (
    id BIGSERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    user_id BIGINT,
    username TEXT,
    first_name TEXT,
    text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для telegram_messages
CREATE INDEX IF NOT EXISTS idx_telegram_messages_chat_id ON public.telegram_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_messages_username ON public.telegram_messages(username);

-- RLS для telegram_messages
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage telegram_messages" ON public.telegram_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- Таблица: telegram_subscriptions (Подписки пользователей Telegram)
-- ============================================
CREATE TABLE IF NOT EXISTS public.telegram_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS для telegram_subscriptions
ALTER TABLE public.telegram_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage telegram_subscriptions" ON public.telegram_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- Функции для автоматического обновления updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для updated_at
CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON public.tools
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Начальные данные (seed data)
-- ============================================
-- Добавим тестовые инструменты
INSERT INTO public.tools (name, category, description, icon, rating, daily_credits, monthly_credits, min_price, has_api, has_mcp, docs_url, pros)
VALUES 
    ('Vercel', 'Deployment', 'Ведущая платформа для деплоя и хостинга Frontend-приложений с автоматическим CI/CD и глобальным CDN.', '🚀', 4.8, '100GB', '3TB', '$0', true, false, 'https://vercel.com/docs', ARRAY['Быстрый TTFB', 'Zero Config', 'Preview Deployment']),
    ('Supabase', 'Database', 'Open-source альтернатива Firebase на базе PostgreSQL с поддержкой Realtime и Auth.', '⚡', 4.7, '500MB', '15GB', '$0', true, true, 'https://supabase.com/docs', ARRAY['SQL доступ', 'Open Source', 'Быстрый старт']),
    ('Figma', 'Design', 'Профессиональный инструмент для совместного проектирования интерфейсов и прототипирования в реальном времени.', '🎨', 4.9, 'Unlimited', 'Unlimited', '$12', true, false, 'https://help.figma.com/hc/en-us', ARRAY['Лучший UX', 'Огромное комьюнити', 'В браузере']),
    ('Prisma', 'ORM', 'Современная ORM для Node.js и TypeScript, которая делает работу с БД безопасной и приятной.', '💎', 4.6, 'Unlimited', 'Unlimited', '$0', true, true, 'https://www.prisma.io/docs', ARRAY['DX на высоте', 'Автозаполнение', 'Надежность']),
    ('Tailwind CSS', 'CSS', 'Utility-first CSS фреймворк для быстрой верстки современных интерфейсов прямо в HTML/JSX.', '🎯', 4.8, 'Unlimited', 'Unlimited', '$0', false, false, 'https://tailwindcss.com/docs', ARRAY['Маленький бандл', 'Скорость верстки', 'Понятно']),
    ('Zustand', 'State', 'Минималистичный, быстрый и масштабируемый менеджер состояния для React приложений.', '🐻', 4.7, 'Unlimited', 'Unlimited', '$0', false, false, 'https://docs.pmnd.rs/zustand', ARRAY['Очень легкий', 'Нет boilerplate', 'Flexibility']),
    ('Next.js', 'Framework', 'Мощный React фреймворк от Vercel для создания производительных веб-приложений с SSR и RSC.', '▲', 4.9, 'Unlimited', 'Unlimited', '$0', false, false, 'https://nextjs.org/docs', ARRAY['SEO friendly', 'Производительность', 'Экосистема']),
    ('Stripe', 'Payments', 'Универсальная платежная инфраструктура для обработки транзакций и управления подписками по всему миру.', '💳', 4.8, '100K', '3M', '2.9%', true, true, 'https://stripe.com/docs', ARRAY['Безопасность', 'API-first', 'Глобальность'])
ON CONFLICT (name) DO NOTHING;

-- Добавим тестовый канал
INSERT INTO public.channels (name, source, url)
VALUES ('AI Academy', 'YouTube', 'https://youtube.com/@aiacademy')
ON CONFLICT DO NOTHING;

-- ============================================
-- pg_cron: Автоматический сбор данных
-- ============================================
-- Включаем расширение pg_cron (если не включено)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- Расписание для соблюдения квот API:
-- YouTube API: 10,000 units/day (бесплатно)
-- Telegram API: нет жёстких ограничений для webhook
-- ============================================

-- Сбор YouTube видео: каждые 6 часов (4 раза в день)
-- Это безопасно для квоты YouTube API
SELECT cron.schedule(
    'fetch-youtube-videos',
    '0 */6 * * *', -- каждые 6 часов: 00:00, 06:00, 12:00, 18:00 UTC
    $$
    SELECT
        net.http_post(
            url := 'https://iwtlekdynhfcqgwhocik.supabase.co/functions/v1/fetch-youtube',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb
        );
    $$
);

-- Анализ постов: каждые 2 часа
-- Обрабатывает неанализированные посты из БД
SELECT cron.schedule(
    'analyze-posts',
    '0 */2 * * *', -- каждые 2 часа
    $$
    SELECT
        net.http_post(
            url := 'https://iwtlekdynhfcqgwhocik.supabase.co/functions/v1/analyze-post',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := '{}'::jsonb
        );
    $$
);

-- Очистка старых telegram_messages (старше 30 дней)
SELECT cron.schedule(
    'cleanup-old-messages',
    '0 3 * * *', -- каждый день в 03:00 UTC
    $$
    DELETE FROM public.telegram_messages
    WHERE created_at < NOW() - INTERVAL '30 days';
    $$
);

-- ============================================
-- Таблица для отслеживания запусков крона
-- ============================================
CREATE TABLE IF NOT EXISTS public.cron_logs (
    id BIGSERIAL PRIMARY KEY,
    job_name TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT DEFAULT 'running',
    error_message TEXT,
    items_processed INTEGER DEFAULT 0
);

-- RLS для cron_logs
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage cron_logs" ON public.cron_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
