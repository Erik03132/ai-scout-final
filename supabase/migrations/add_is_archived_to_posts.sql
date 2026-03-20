-- ============================================
-- Миграция: Добавление поля is_archived для постов
-- ============================================
-- Дата: 2026-03-20
-- Описание: Добавляет поддержку архивации постов с сохранением в БД
-- ============================================

-- Добавляем колонку is_archived в таблицу posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Создаём индекс для быстрого поиска заархивированных постов
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON public.posts(is_archived);

-- Создаём композитный индекс для фильтрации по архиву + дате
CREATE INDEX IF NOT EXISTS idx_posts_archived_created ON public.posts(is_archived, created_at DESC);

-- Обновляем комментарий к колонке
COMMENT ON COLUMN public.posts.is_archived IS 'Флаг архивации поста. true = пост в архиве, false = в ленте';

-- Проверяем, что колонка добавлена
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'posts' 
        AND column_name = 'is_archived'
    ) THEN
        RAISE NOTICE 'Колонка is_archived успешно добавлена в таблицу posts';
    ELSE
        RAISE EXCEPTION 'Не удалось добавить колонку is_archived';
    END IF;
END $$;
