-- =====================================================
-- Массовый перевод старых постов на русский язык
-- Запустить в Supabase SQL Editor
-- =====================================================

-- 1. Сначала проверим, сколько постов требуют перевода
SELECT 
    COUNT(*) as total_posts,
    COUNT(CASE WHEN is_analyzed = false THEN 1 END) as not_analyzed,
    COUNT(CASE WHEN title ~ '^[A-Za-z]' THEN 1 END) as english_titles
FROM posts;

-- 2. Обновляем posts, которые еще не были проанализированы
-- Помечаем их для повторного анализа
UPDATE posts
SET is_analyzed = false
WHERE is_analyzed = true
  AND title ~ '^[A-Za-z]'  -- Заголовок начинается с латиницы
  AND source = 'YouTube'
  AND id IN (
    SELECT id FROM posts
    WHERE is_analyzed = true
      AND title ~ '^[A-Za-z]'
      AND source = 'YouTube'
    LIMIT 50  -- Ограничим 50 постами за раз
  );

-- 3. После этого запустите Edge Function analyze-post:
-- curl -X POST 'https://iwtlekdynhfcqgwhocik.supabase.co/functions/v1/analyze-post' \
--   -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY'

-- =====================================================
-- Альтернатива: Простой SQL-перевод через AI (если есть pgvector)
-- =====================================================

-- Если у вас включен pgvector и есть доступ к AI, можно использовать такую функцию:
/*
CREATE OR REPLACE FUNCTION translate_post_title(post_id UUID) 
RETURNS TEXT AS $$
DECLARE
    original_title TEXT;
    translated_title TEXT;
BEGIN
    -- Получаем оригинальный заголовок
    SELECT title INTO original_title FROM posts WHERE id = post_id;
    
    -- Запрос к AI через Supabase AI (если настроено)
    -- Это псевдокод - реальный AI вызов зависит от вашей конфигурации
    
    -- Обновляем запись
    UPDATE posts 
    SET title = translated_title,
        is_analyzed = true
    WHERE id = post_id;
    
    RETURN translated_title;
END;
$$ LANGUAGE plpgsql;
*/

-- =====================================================
-- Проверка результатов
-- =====================================================

-- После запуска analyze-post проверьте результаты:
SELECT 
    id,
    title,
    summary,
    source,
    is_analyzed,
    created_at
FROM posts 
WHERE source = 'YouTube' 
ORDER BY created_at DESC 
LIMIT 20;
