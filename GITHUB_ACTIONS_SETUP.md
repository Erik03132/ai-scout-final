# Настройка GitHub Actions для авто-сбора новостей

## ✅ Созданные workflow

| Файл | Задача | Расписание |
|------|--------|------------|
| `.github/workflows/fetch-telegram-daily.yml` | Сбор Telegram постов | 07:00 UTC (10:00 MSK) |
| `.github/workflows/fetch-youtube-daily.yml` | Сбор YouTube видео | 06:00 UTC (09:00 MSK) |
| `.github/workflows/analyze-posts.yml` | AI-анализ постов | 09:00 UTC (12:00 MSK) |

---

## 📋 Инструкция по настройке (5 минут)

### Шаг 1: Добавь секрет в GitHub

1. Открой репозиторий на GitHub
2. Перейди в **Settings** → **Secrets and variables** → **Actions**
3. Нажми **New repository secret**
4. Добавь секрет:

   **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   
   **Secret:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY`

5. Нажми **Add secret**

### Шаг 2: Задеплой workflow на GitHub

```bash
git add .github/workflows/
git commit -m "Add GitHub Actions for daily news fetch"
git push
```

### Шаг 3: Проверь что workflow активировались

1. Перейди в **Actions** в твоем GitHub репозитории
2. Увидишь 3 workflow:
   - Fetch Telegram Daily
   - Fetch YouTube Daily
   - Analyze Posts
3. Они запустятся по расписанию автоматически

### Шаг 4: (Опционально) Запусти вручную для теста

1. Вкладка **Actions** → выбери workflow
2. Нажми **Run workflow**
3. Через 1-2 минуты увидишь результат ✅

---

## 📅 Расписание (время Московское)

| Время | Задача |
|-------|--------|
| 09:00 | Сбор YouTube |
| 10:00 | Сбор Telegram |
| 12:00 | AI-анализ постов |

---

## 🔍 Мониторинг

### Проверить логи:
GitHub → Actions → выбери workflow → последний запуск

### Проверить что посты добавились:
```bash
node check-telegram-cron.cjs
```

---

## ✨ Преимущества GitHub Actions vs Vercel Cron

| Критерий | GitHub Actions | Vercel Cron |
|----------|---------------|-------------|
| Надежность | ✅ Высокая | ⚠️ Зависит от деплоя |
| Логирование | ✅ Удобные логи | ⚠️ В дашборде Vercel |
| Ручной запуск | ✅ 1 клик | ⚠️ Через API |
| Бесплатно | ✅ 2000 минут/мес | ✅ Есть на Hobby |
| Настройка | ✅ 5 минут | ⚠️ Нужно проверять деплой |

---

## 🆘 Если что-то не работает

1. Проверь что секрет добавлен в GitHub Settings
2. Проверь логи в Actions — там будет ошибка
3. Запусти вручную через **Run workflow** для теста
