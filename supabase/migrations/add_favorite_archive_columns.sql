-- Добавляем колонки в posts (для архива)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Добавляем is_favorite в tools (для избранных приложений)
ALTER TABLE public.tools 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Индексы для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON public.posts(is_archived);
CREATE INDEX IF NOT EXISTS idx_posts_is_favorite ON public.posts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_tools_is_favorite ON public.tools(is_favorite);
