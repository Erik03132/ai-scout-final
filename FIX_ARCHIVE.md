# Исправление проблемы с Архивом

## 🐛 Проблема

При нажатии на кнопку **"В архив"** новость не сохраняется в архиве. Вкладка "Архив" остаётся пустой.

## 🔍 Причина

В таблице `posts` отсутствует колонка `is_archived`. При попытке обновить поле происходит ошибка.

## ✅ Решение

Нужно добавить поле `is_archived` в таблицу `posts`.

### Способ 1: Через Supabase SQL Editor (рекомендуется)

1. Открой [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбери свой проект
3. Перейди в **SQL Editor**
4. Скопируй и выполни этот SQL:

```sql
-- Добавляем поле is_archived в таблицу posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Добавляем индекс для быстрого поиска архивных постов
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);
```

5. Нажми **Run**
6. Готово! ✅

### Способ 2: Через Supabase CLI

```bash
# Установи CLI если нет
npm install -g supabase

# Войди в аккаунт
supabase login

# Примени миграцию
supabase db push --db-url "your_supabase_db_url"
```

## 🧪 Проверка

После применения миграции:

1. **Обнови страницу** приложения (Ctrl+R / Cmd+R)
2. Открой любую новость в ленте
3. Нажми кнопку **"📁 В архив"**
4. Перейди во вкладку **"Архив"** - новость должна появиться

## 📊 Статистика

На момент проверки:
- Всего постов: 455
- Архивировано: 4
- Активных: 451

После исправления архив должен работать корректно.

## 🔧 Дополнительные команды

### Проверить количество архивных постов:
```sql
SELECT COUNT(*) as archived_count 
FROM posts 
WHERE is_archived = true;
```

### Вернуть пост из архива:
```sql
UPDATE posts 
SET is_archived = false 
WHERE id = 'POST_ID';
```

### Удалить все архивные посты:
```sql
DELETE FROM posts WHERE is_archived = true;
```
