/**
 * Vercel Serverless Function: YouTube Latest Video
 * Endpoint: GET /api/youtube-latest?channel={handleOrId}
 *
 * Получает последнее видео с YouTube канала
 * Использует YouTube Data API v3
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60; // Set max duration for Hobby plan limit

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  summary: string;
  channelTitle: string;
  publishedAt: string;
}

interface YouTubeChannelIdResponse {
  items: Array<{
    id: string;
  }>;
}

interface YouTubeChannelResponse {
  items: Array<{
    contentDetails: {
      relatedPlaylists: {
        uploads: string;
      };
    };
  }>;
}

interface YouTubePlaylistResponse {
  items: Array<{
    contentDetails: {
      videoId: string;
    };
  }>;
}

interface YouTubeVideoResponse {
  items: Array<{
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      publishedAt: string;
    };
  }>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Проверка метода
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channel } = req.query;

  if (!channel || typeof channel !== 'string') {
    return res.status(400).json({ error: 'Channel parameter is required' });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    const video = await getLatestVideo(channel, apiKey);
    return res.status(200).json(video);
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch video'
    });
  }
}

/**
 * Получить последнее видео с канала
 */
async function getLatestVideo(channel: string, apiKey: string): Promise<YouTubeVideo> {
  let channelId = channel;

  // Если это handle (@username) или не начинается с UC — получаем channelId
  if (channel.startsWith('@') || !channel.startsWith('UC')) {
    channelId = await getChannelId(channel, apiKey);
  }

  // Получаем uploads playlist ID
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId, apiKey);

  // Получаем последнее видео из playlist
  const latestVideoId = await getLatestVideoFromPlaylist(uploadsPlaylistId, apiKey);

  // Получаем детали видео
  const videoDetails = await getVideoDetails(latestVideoId, apiKey);

  return videoDetails;
}

/**
 * Получить Channel ID по handle или username
 * FIX: используем part=id и возвращаем items[0].id (строку), а не contentDetails
 */
async function getChannelId(identifier: string, apiKey: string): Promise<string> {
  // Убираем @ если есть
  const handle = identifier.startsWith('@') ? identifier.slice(1) : identifier;

  // Пробуем найти по handle
  const handleUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forHandle=${handle}&part=id`;
  const handleResponse = await fetch(handleUrl);
  const handleData = await handleResponse.json() as YouTubeChannelIdResponse;

  if (handleData.items && handleData.items.length > 0) {
    return handleData.items[0].id;
  }

  // Если не нашли по handle, пробуем по username
  const usernameUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forUsername=${handle}&part=id`;
  const usernameResponse = await fetch(usernameUrl);
  const usernameData = await usernameResponse.json() as YouTubeChannelIdResponse;

  if (usernameData.items && usernameData.items.length > 0) {
    return usernameData.items[0].id;
  }

  // Если всё ещё не нашли, используем search
  const searchChannelUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(handle)}&type=channel&part=id&maxResults=1`;
  const searchResponse = await fetch(searchChannelUrl);
  const searchData = await searchResponse.json() as { items?: Array<{ id: { channelId: string } }> };

  if (searchData.items && searchData.items.length > 0) {
    return searchData.items[0].id.channelId;
  }

  throw new Error(`Channel not found: ${identifier}`);
}

/**
 * Получить ID плейлиста с загрузками
 */
async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string> {
  const url = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=contentDetails`;
  const response = await fetch(url);
  const data = await response.json() as YouTubeChannelResponse;

  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found');
  }

  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

/**
 * Получить ID последнего видео из плейлиста
 */
async function getLatestVideoFromPlaylist(playlistId: string, apiKey: string): Promise<string> {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=contentDetails&maxResults=1`;
  const response = await fetch(url);
  const data = await response.json() as YouTubePlaylistResponse;

  if (!data.items || data.items.length === 0) {
    throw new Error('No videos found in channel');
  }

  return data.items[0].contentDetails.videoId;
}

/**
 * Получить детали видео
 */
async function getVideoDetails(videoId: string, apiKey: string): Promise<YouTubeVideo> {
  const url = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoId}&part=snippet`;
  const response = await fetch(url);
  const data = await response.json() as YouTubeVideoResponse;

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found');
  }

  const snippet = data.items[0].snippet;

  // Генерируем саммари и перевод через Gemini
  const aiResult = await generateSummary(snippet.title, snippet.description);

  return {
    videoId,
    title: aiResult.title || snippet.title,
    description: snippet.description,
    summary: aiResult.summary,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
  };
}

/**
 * Генерация саммари через Gemini API
 */
async function generateSummary(title: string, description: string): Promise<{ title: string; summary: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return { title: title, summary: createFallbackSummary(description) };
  }

  try {
    const content = `Title: ${title}\nDescription: ${description}`.substring(0, 8000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ты — профессиональный редактор новостей. Проанализируй это видео и верни ответ на качественном РУССКОМ языке.
ОЧЕНЬ ВАЖНО: Весь ответ ДОЛЖЕН БЫТЬ НА РУССКОМ ЯЗЫКЕ. Даже если заголовок и описание на английском — ПЕРЕВЕДИ ИХ.

1. "title": Переведи заголовок на качественный русский язык.
2. "summary": Краткое информативное саммари на русском (2-3 длинных предложения).

JSON СТРУКТУРА:
{
  "title": "Шикарный перевод заголовка",
  "summary": "Информативное описание видео на русском языке."
}

Контент: ${content}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error in youtube-latest:', errText);
      return { title: title, summary: createFallbackSummary(description) };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text);
      return {
        title: parsed.title || title,
        summary: parsed.summary || createFallbackSummary(description)
      };
    } catch (e) {
      console.error('Failed to parse Gemini JSON in youtube-latest:', text);
      return { title: title, summary: createFallbackSummary(description) };
    }
  } catch (error) {
    console.error('Gemini summarization failed in youtube-latest:', error);
    return { title: title, summary: createFallbackSummary(description) };
  }
}


/**
 * Fallback генерация саммари
 */
function createFallbackSummary(description: string): string {
  // Фильтруем строки с ссылками и слишком короткие
  const sentences = description
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => {
      if (/https?:\/\/|bit\.ly|t\.me/i.test(s)) return false;
      if (s.length < 30) return false;
      return true;
    });

  let summary = sentences[0] || '';

  // Если в тексте нет кириллицы, но есть латиница — это скорее всего английский текст
  // В таком случае не выводим его как готовое саммари, а ждем полноценного AI-анализа
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(summary);
  if (summary && !hasCyrillic && /[a-zA-Z]/.test(summary)) {
    return 'Описание на английском. AI-анализ и перевод подготавливаются...';
  }

  if (summary.length > 150) {
    summary = summary.substring(0, 150).trim() + '...';
  }

  return summary || 'Описание недоступно';
}
