-- Добавляем колонки is_favorite и is_archived в таблицу posts
-- Запустить в SQL Editor на Supabase

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Создаём индексы для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON public.posts(is_archived);
CREATE INDEX IF NOT EXISTS idx_posts_is_favorite ON public.posts(is_favorite);

-- Проверяем результат
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name IN ('is_favorite', 'is_archived');
