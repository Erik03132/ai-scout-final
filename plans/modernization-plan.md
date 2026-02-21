# План модернизации проекта AI Scout

## Обзор проекта

**Проект:** `ai-scout-final` (React/Vite)  
**Главный файл:** `src/App.tsx`  
**Цель:** Заменить моковую логику на реальную интеграцию с YouTube, Telegram и AI-сервисами.

---

## Архитектура решения

```mermaid
flowchart TB
    subgraph Frontend [Frontend - React/Vite]
        A[App.tsx]
        B[fetchLatestPost]
        C[generateAISummary]
        D[Форма добавления канала]
    end

    subgraph Backend [Backend - Vercel Functions]
        E[/api/youtube-latest]
        F[/api/telegram-latest]
        G[/api/summarize]
    end

    subgraph External [Внешние API]
        H[YouTube Data API v3]
        I[Telegram API]
        J[LLM - OpenAI/Gemini]
    end

    A --> B
    A --> C
    A --> D
    B --> E
    B --> F
    C --> G
    E --> H
    F --> I
    G --> J
```

---

## Блок 2: Рефакторинг generateAISummary

### Текущее состояние
- Имитация задержки через `setTimeout`
- Случайная генерация `tags` и `mentions`
- Нет реального AI-анализа

### Целевое состояние
```typescript
const generateAISummary = async (post: Partial<Post>): Promise<SummaryResult> => {
  const content = post.content || '';
  
  if (!content.trim()) {
    return getFallbackSummary(post);
  }

  try {
    const response = await fetch('/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) throw new Error('API Error');
    
    return await response.json();
  } catch (error) {
    console.error('Summary generation failed:', error);
    return getFallbackSummary(post);
  }
};

const getFallbackSummary = (post: Partial<Post>) => ({
  summary: post.content?.substring(0, 200) || '',
  tags: [],
  mentions: [],
  detailedUsage: '',
  usageTips: []
});
```

### Файлы для изменения
- `src/App.tsx` - функция `generateAISummary`

---

## Блок 3: Backend-endpoint /api/summarize

### Структура endpoint
```
POST /api/summarize
Content-Type: application/json

Request:  { "content": "string" }
Response: { "summary": "string", "tags": [], "mentions": [], "detailedUsage": "string", "usageTips": [] }
```

### Реализация
- Файл: `api/summarize.ts` (Vercel Function)
- LLM: OpenAI GPT-4 / Gemini Pro
- Промпт для структурированного JSON-ответа

### Промпт для LLM
```
Проанализируй текст и верни JSON:
{
  "summary": "краткое саммари 2-3 предложения на русском",
  "tags": ["AI", "Next.js", "Backend"], // 1-5 тегов
  "mentions": ["Vercel", "Supabase"], // конкретные инструменты
  "detailedUsage": "осмысленный абзац о применении",
  "usageTips": ["совет 1", "совет 2", "совет 3"]
}
```

---

## Блок 4: Реальный контент YouTube

### Текущее состояние
- Моковые данные с захардкоженным текстом
- Извлечение только `videoId` для миниатюры

### Целевое состояние
```typescript
const fetchLatestPost = async (channel) => {
  if (channel.source === 'YouTube') {
    const channelId = extractChannelIdOrHandle(channel.url);
    const video = await fetch(`/api/youtube-latest?channel=${channelId}`);
    
    return {
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      image: `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`,
      channel: video.channelTitle,
      source: 'YouTube',
      date: video.publishedAt,
      content: video.description
    };
  }
  // ...
};
```

### Helper-функция
```typescript
const extractChannelIdOrHandle = (url: string): string => {
  // @handle
  if (url.includes('/@')) return url.split('/@')[1]?.split('/')[0];
  // /channel/ID
  if (url.includes('/channel/')) return url.split('/channel/')[1]?.split('/')[0];
  // /c/name
  if (url.includes('/c/')) return url.split('/c/')[1]?.split('/')[0];
  return url;
};
```

---

## Блок 5: Backend-endpoint /api/youtube-latest

### Структура endpoint
```
GET /api/youtube-latest?channel={handleOrId}

Response: {
  "videoId": "string",
  "title": "string",
  "description": "string",
  "channelTitle": "string",
  "publishedAt": "ISO string"
}
```

### Реализация
- Файл: `api/youtube-latest.ts`
- YouTube Data API v3
- Переменная окружения: `YOUTUBE_API_KEY`

### Алгоритм
1. Определить тип идентификатора (channelId vs handle)
2. Получить `uploads` playlist ID
3. Получить последнее видео из playlist
4. Вернуть структурированный ответ

---

## Блок 6: Реальный контент Telegram

### Целевое состояние
```typescript
if (channel.source === 'Telegram') {
  const channelName = extractTelegramChannel(channel.url);
  const post = await fetch(`/api/telegram-latest?channel=${channelName}`);
  
  return {
    title: post.title || `Новый пост в канале ${channel.name}`,
    url: post.link,
    image: getRandomAiImage(),
    channel: channel.name,
    source: 'Telegram',
    date: post.date,
    content: post.text
  };
}
```

### Helper-функции
```typescript
const extractTelegramChannel = (url: string): string => {
  if (url.includes('t.me/')) return url.split('t.me/')[1]?.split('/')[0];
  if (url.startsWith('@')) return url.substring(1);
  return url;
};

const getRandomAiImage = (): string => {
  const images = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349',
    'https://images.unsplash.com/photo-1655635949384-f737c5133dfe'
  ];
  const random = images[Math.floor(Math.random() * images.length)];
  return `${random}?auto=format&fit=crop&q=80&w=400&h=200`;
};
```

---

## Блок 7: Backend-endpoint /api/telegram-latest

### Структура endpoint
```
GET /api/telegram-latest?channel={nameOrLink}

Response: {
  "title": "string | null",
  "text": "string",
  "link": "string",
  "date": "ISO string"
}
```

### Варианты реализации
1. **Telegram Bot API** - бот должен быть админом канала
2. **Telethon** - клиентская библиотека (требует API ID и Hash)
3. **Парсинг** - как fallback

### Переменные окружения
- `TELEGRAM_BOT_TOKEN` или `TELEGRAM_API_ID` + `TELEGRAM_API_HASH`

---

## Блок 8: Интеграция в форму

### Обновлённый обработчик
```typescript
const handleAddChannel = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const newChannel = { name, url, source };
    
    // 1. Получаем контент
    const latestPost = await fetchLatestPost(newChannel);
    
    // 2. Генерируем AI-саммари
    const aiSummary = await generateAISummary(latestPost);
    
    // 3. Создаём пост
    const newPost: Post = {
      id: Date.now(),
      title: latestPost.title || '',
      summary: aiSummary.summary,
      source: newChannel.source,
      channel: newChannel.name,
      date: formatDate(latestPost.date),
      tags: aiSummary.tags,
      mentions: aiSummary.mentions,
      views: '0',
      image: latestPost.image || '',
      url: latestPost.url || '',
      detailedUsage: aiSummary.detailedUsage,
      usageTips: aiSummary.usageTips
    };

    setPosts(prev => [newPost, ...prev]);
    setChannels(prev => [...prev, newChannel]);
  } catch (error) {
    console.error('Error adding channel:', error);
  } finally {
    setIsLoading(false);
  }
};
```

---

## Блок 9: Проверка отображения

### Чек-лист
- [ ] Разные посты имеют разные заголовки
- [ ] Теги соответствуют теме контента
- [ ] Блок "Упомянуто" показывает реальные инструменты
- [ ] Модалка саммари корректно отображает AI-анализ
- [ ] YouTube обложки загружаются корректно
- [ ] Telegram посты получают случайные AI-изображения

---

## Порядок реализации

1. **Блок 3** - `/api/summarize` (базовый endpoint)
2. **Блок 2** - Рефакторинг `generateAISummary`
3. **Блок 5** - `/api/youtube-latest`
4. **Блок 4** - Обновление `fetchLatestPost` для YouTube
5. **Блок 7** - `/api/telegram-latest`
6. **Блок 6** - Обновление `fetchLatestPost` для Telegram
7. **Блок 8** - Интеграция в форму
8. **Блок 9** - Тестирование

---

## Переменные окружения

```env
# .env.local
YOUTUBE_API_KEY=your_youtube_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
# или
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# LLM
OPENAI_API_KEY=your_openai_key
# или
GEMINI_API_KEY=your_gemini_key
```
