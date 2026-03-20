# Antigravity Launcher

Wrapper для запуска Antigravity с разными идентичностями (proxy + настройки).

## 🚀 Быстрый старт

```bash
# Обновить конфигурацию терминала
source ~/.zshrc

# Посмотреть доступные идентичности
agi -l

# Запустить с активной идентичностью
agi

# Запустить с конкретной идентичностью
agi -i Account-2

# Установить активную идентичность
agi-set Account-1
```

## 📋 Команды

| Команда | Описание |
|---------|----------|
| `agi` | Запуск с активной идентичностью |
| `agi -i <name>` | Запуск с указанной идентичностью |
| `agi -l` | Список всех идентичностей |
| `agi-set <name>` | Установить активную идентичность |
| `agi --help` | Показать справку |

## ⚙️ Конфигурация

Файл конфигурации: `~/.antigravity/identities.json`

### Пример конфигурации

```json
{
  "active_identity": "Account-1",
  "identities": {
    "Account-1": {
      "name": "Work Account",
      "proxy": "http://user:pass@proxy.company.com:8080",
      "mask": {
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
        "viewport": { "width": 1920, "height": 1080 },
        "timezone": "Europe/Berlin",
        "locale": "de-DE"
      }
    },
    "Account-2": {
      "name": "Personal Account",
      "proxy": "http://user:pass@personal-proxy.com:3128",
      "mask": {
        "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
        "viewport": { "width": 1440, "height": 900 },
        "timezone": "America/New_York",
        "locale": "en-US"
      }
    }
  }
}
```

### Поля идентичности

| Поле | Описание |
|------|----------|
| `name` | Человекочитаемое имя |
| `proxy` | Proxy URL в формате `http://user:pass@host:port` |
| `mask.userAgent` | User Agent строка |
| `mask.viewport` | Разрешение экрана |
| `mask.timezone` | Временная зона |
| `mask.locale` | Язык/регион |

## 🔧 Установка вручную

```bash
# Создать директорию
mkdir -p ~/.antigravity/bin

# Скопировать скрипты
cp launch-antigravity.cjs ~/.antigravity/bin/
cp agi ~/.antigravity/bin/
chmod +x ~/.antigravity/bin/*

# Добавить в ~/.zshrc или ~/.bashrc
export PATH="$HOME/.antigravity/bin:$PATH"
alias agi="launch-antigravity.cjs"
alias agi-list="launch-antigravity.cjs --list"
alias agi-set="launch-antigravity.cjs --set"

# Применить изменения
source ~/.zshrc
```

## 📝 Примеры использования

### Запуск с разными аккаунтами

```bash
# Рабочий аккаунт (утро)
agi -i Account-1

# Личный аккаунт (вечер)
agi -i Account-2
```

### Быстрое переключение

```bash
# Установить аккаунт по умолчанию
agi-set Account-1

# Запустить с аккаунтом по умолчанию
agi
```

### Просмотр конфигурации

```bash
# Показать все идентичности
agi -l

# Открыть конфиг для редактирования
code ~/.antigravity/identities.json
# или
nano ~/.antigravity/identities.json
```

## 🔐 Безопасность

- ⚠️ **Не храните реальные пароли в plain text!**
- Используйте environment variables для чувствительных данных:
  ```json
  {
    "Account-1": {
      "proxy": "http://${PROXY_USER}:${PROXY_PASS}@proxy.company.com:8080"
    }
  }
  ```
- Установите правильные права на файл:
  ```bash
  chmod 600 ~/.antigravity/identities.json
  ```

## 🐛 Troubleshooting

### Antigravity не запускается
```bash
# Проверить путь к приложению
ls -la /Applications/Antigravity.app/Contents/MacOS/Antigravity

# Запустить с логом
agi 2>&1 | tee ~/antigravity.log
```

### Proxy не работает
```bash
# Проверить proxy
curl -x http://user:pass@proxy:port https://api.example.com

# Проверить переменные окружения
env | grep -i proxy
```

### Конфликт идентичностей
```bash
# Сбросить активную идентичность
agi-set Account-1

# Проверить конфиг
cat ~/.antigravity/identities.json | jq .
```

## 📄 Лицензия

MIT
