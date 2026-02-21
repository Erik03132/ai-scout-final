/**
 * Vercel Serverless Function: YouTube Latest Video
 * Endpoint: GET /api/youtube-latest?channel={handleOrId}
 *
 * Получает последнее видео с YouTube канала
 * Использует YouTube Data API v3
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
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
  return {
    videoId,
    title: snippet.title,
    description: snippet.description,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
  };
}
