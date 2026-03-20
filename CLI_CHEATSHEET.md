# CLI Шпаргалка

Полезные команды для повседневной работы.

---

## 🔧 Vercel CLI

```bash
# Авторизация
vercel login

# Привязать проект к Vercel
vercel link

# Деплой (preview)
vercel

# Деплой в продакшн
vercel --prod

# Скачать env из Vercel → локально
vercel env pull .env.local

# Посмотреть список env переменных
vercel env ls

# Добавить env переменную
vercel env add ПЕРЕМЕННАЯ production

# Удалить env
vercel env rm ПЕРЕМЕННАЯ production
```

---

## 📦 npm

```bash
npm run dev          # Dev-сервер (+ проверка env)
npm run build        # Production-сборка
npm run lint         # ESLint проверка
npm run type-check   # TypeScript компиляция
npm test             # Vitest тесты
npm run pre-deploy   # Полная проверка перед деплоем
```

---

## 🔀 Git

```bash
# Conventional commits
git commit -m "feat: новая фича"
git commit -m "fix: исправление бага"
git commit -m "chore: обновление зависимостей"
git commit -m "docs: обновление документации"

# Создать ветку и переключиться
git checkout -b feat/my-feature

# Запушить ветку
git push -u origin feat/my-feature

# Слить в main
git checkout main
git merge feat/my-feature
git push
```

---

## 🛡️ GitHub CLI (gh) — если установлен

```bash
# Авторизация
gh auth login

# Создать репо из текущей папки
gh repo create my-project --public --source=. --push

# Создать PR
gh pr create --title "feat: описание" --body "подробности"

# Посмотреть статус CI
gh run list

# Посмотреть логи CI
gh run view --log
```

---

## 🗄️ Supabase CLI — если установлен

```bash
# Авторизация
npx supabase login

# Привязать к проекту
npx supabase link --project-ref YOUR_PROJECT_ID

# Скачать схему БД
npx supabase db dump -f schema.sql

# Сгенерировать TypeScript типы
npx supabase gen types typescript --linked > src/lib/supabase/types.ts

# Миграции
npx supabase migration new my_migration
```

---

## 🤖 Gemini CLI (Fallback Mode)

```bash
gemini                        # Запуск интерактивного чата
gemini --yolo                 # Режим "Агента" (авто-правки файлов)
gemini --approval-mode auto_edit # Правки файлов без подтверждения
gemini --resume latest        # Продолжить последнюю сессию
gemini -p "Текст запроса"     # Одиночный запрос из терминала
```

