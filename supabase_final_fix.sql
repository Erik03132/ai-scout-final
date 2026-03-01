-- 1. Исправляем уникальные индексы
ALTER TABLE IF EXISTS public.channels DROP CONSTRAINT IF EXISTS channels_url_unique;
ALTER TABLE public.channels ADD CONSTRAINT channels_url_unique UNIQUE (url);

ALTER TABLE IF EXISTS public.posts DROP CONSTRAINT IF EXISTS posts_url_unique;
ALTER TABLE public.posts ADD CONSTRAINT posts_url_unique UNIQUE (url);

-- 2. Глобально отключаем RLS для всех таблиц (самый быстрый способ заставить работать в демо)
-- После того как данные пойдут, можно будет включить и настроить тонко.
ALTER TABLE public.channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites DISABLE ROW LEVEL SECURITY;

-- 3. Если таблицы не создались — создаем
CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id text NOT NULL,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Добавляем тестовый канал
INSERT INTO public.channels (name, source, url, is_active)
VALUES ('AI News', 'YouTube', 'https://youtube.com/@ai_news', true)
ON CONFLICT (url) DO NOTHING;
