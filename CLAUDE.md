# CLAUDE.md — ai-scout

> Автогенерируемые правила на основе https://code.claude.com/docs/en/prompt-library

## Паттерны

### Behavior-based search
Ищи по поведению, а не по файлам:
- ПЛОХО: "Прочитай PostFilters.tsx"
- ХОРОШО: "Где фильтруются посты по тегам?"

### Plan before code
Спланируй изменения перед редактированием:
```
1. Какие файлы затронуты?
2. Какой паттерн использовать?
3. Какие тесты написать?
```

### Follow existing patterns
Копируй паттерны из существующего кода:
- Компоненты: React + TypeScript
- Стили: Tailwind CSS (bg-slate-800, text-white)
- Состояние: useState + useEffect

### Review before commit
Всегда просмотри изменения перед коммитом:
- Нет ли TypeScript ошибок?
- Сохранён ли паттерн?
- Добавлены ли метрики?

## Архитектура

### 3 Агента (мультиагентная система)
1. **Collector** — Сбор данных (Habr, Medium, Twitter, Telegram)
2. **Analyst** — Анализ (скоринг, кластеризация)
3. **Curator** — Экспорт (Telegram дайджесты)

### Пропорция
- 70% workflow (детерминированный)
- 30% autonomous (LLM для кластеризации)

## Метрики

- Fetch time: <5s (per source)
- Score accuracy: >85% (vs manual)
- Cluster quality: >80% (human review)
- Export success: >99% (Telegram API)
- Cost per run: <$0.10 (API calls)

## Запреты

- НЕ создавай монолитные классы > 500 строк
- НЕ используй LLM для детерминированных задач
- НЕ удаляй метрики без согласования
- НЕ деплой без тестов

## Источники

- Статья 1054436: https://habr.com/ru/companies/alpinadigital/articles/1054436/
- Prompt Library: https://code.claude.com/docs/en/prompt-library
