-- 1. Добавляем уникальные индексы для корректной работы UPSERT
ALTER TABLE public.channels ADD CONSTRAINT channels_url_unique UNIQUE (url);
ALTER TABLE public.posts ADD CONSTRAINT posts_url_unique UNIQUE (url);

-- 2. Обновляем RLS политики для таблицы favorites, чтобы все могли читать/писать (для демо)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;
CREATE POLICY "Everyone can manage favorites" ON public.favorites FOR ALL USING (true) WITH CHECK (true);

-- 3. Добавляем тестовые данные в каналы, если их нет
INSERT INTO public.channels (name, source, url)
VALUES 
    ('AI Academy', 'YouTube', 'https://youtube.com/@aiacademy'),
    ('Neural Networks', 'Telegram', 'https://t.me/neyroseti_dr')
ON CONFLICT (url) DO NOTHING;
