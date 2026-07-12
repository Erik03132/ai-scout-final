# AGENTS.md — AI Scout

React/TypeScript приложение для мониторинга Telegram каналов и YouTube с Supabase. Сбор контента по ключевым словам.

---

## Команды сессии

### `start-day-ai-scout` — Старт сессии

1. **Прочитать регламенты:** `AGENTS.md` + `chp.md` + последний `checkpoints/chp_*.md`
2. **claude-mem:** `memory_search("ai-scout")` — подтянуть историю
3. **Git:** `git status`
4. **.env:** проверить ключи `VITE_BLINK_*`, Supabase — не пустые
5. **Handoff:** проверить `docs/handoff_*.json`
6. **Скилл:** загрузить `web-standards` (React/Vite)
7. Вывести краткую сводку

### `finish-day-ai-scout` — Завершение сессии

1. **Обновить `chp.md`**
2. **Копировать** → `checkpoints/chp_<timestamp>.md`
3. **claude-mem:** `memory_add kind=session-summary`
4. **Git:** `git add -A && git commit -m "..." && git push`
5. Сообщить пользователю: "Сессия завершена"
