# Инструкция по добавлению поля is_archived

## Проблема
Поле `is_archived` отсутствует в таблице `posts`, поэтому архивация постов не сохраняется в базе данных.

## Решение

### Вариант 1: Через Supabase Dashboard (рекомендуется)

1. Откройте https://supabase.com/dashboard/project/iwtlekdynhfcqgwhocik/sql
2. Скопируйте содержимое файла `supabase/migrations/add_is_archived_to_posts.sql`
3. Вставьте в SQL Editor и нажмите **Run**
4. Проверьте, что миграция применилась успешно

### Вариант 2: Через Supabase CLI

```bash
cd /Users/igorvasin/Antigravity-project-2026/ai-scout-final
supabase db push
```

## Проверка

После применения миграции выполните SQL запрос:

```sql
-- Проверка наличия колонки
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'is_archived';

-- Результат должен быть:
-- column_name  | data_type | column_default
-- is_archived  | boolean   | false
```

## Тестирование

1. Откройте приложение
2. В ленте новостей нажмите на иконку архива (📁) у любого поста
3. Перезагрузите страницу (F5)
4. Перейдите во вкладку "Архив" — пост должен быть там
5. Нажмите "Убрать из архива" — пост должен вернуться в ленту

## Структура миграции

Миграция добавляет:
- ✅ Колонку `is_archived BOOLEAN DEFAULT false`
- ✅ Индекс `idx_posts_is_archived` для быстрого поиска
- ✅ Композитный индекс `idx_posts_archived_created` для сортировки
- ✅ Комментарий к колонке

## SQL для ручной проверки

```sql
-- Посмотреть все заархивированные посты
SELECT id, title, channel, date, is_archived 
FROM posts 
WHERE is_archived = true 
ORDER BY created_at DESC;

-- Посчитать количество заархивированных постов
SELECT COUNT(*) as archived_count 
FROM posts 
WHERE is_archived = true;
```
