-- Добавляем поле is_archived в таблицу posts
-- Это нужно для работы функции архивирования новостей

ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Добавляем индекс для быстрого поиска архивных постов
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);

-- Добавляем поле is_favorite для обратной совместимости (опционально)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Создаем индекс для избранного
CREATE INDEX IF NOT EXISTS idx_posts_is_favorite ON posts(is_favorite);
