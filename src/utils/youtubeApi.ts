/**
 * YouTube API утилиты
 * Функции для работы с YouTube URL и извлечения данных
 */

/**
 * Извлекает ID видео из различных форматов YouTube URL
 * @param url - YouTube URL или ID видео
 * @returns ID видео (11 символов) или null
 */
export const extractVideoId = (url: string): string | null => {
    // Поддерживаем различные форматы YouTube URL:
    // - https://www.youtube.com/watch?v=VIDEO_ID
    // - https://youtu.be/VIDEO_ID
    // - https://www.youtube.com/embed/VIDEO_ID
    // - https://www.youtube.com/v/VIDEO_ID
    // - https://www.youtube.com/shorts/VIDEO_ID
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/ // Если передан просто ID видео
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

/**
 * Извлекает ID канала из YouTube URL
 * @param url - YouTube канал URL
 * @returns ID канала или имя пользователя
 */
export const extractChannelId = (url: string): string | null => {
    // Если это URL канала
    if (url.includes('/channel/')) {
        return url.split('/channel/')[1]?.split('/')[0] || null;
    }
    // Если это URL пользователя
    if (url.includes('/@')) {
        return url.split('/@')[1]?.split('/')[0] || null;
    }
    // Если это URL пользователя (старый формат)
    if (url.includes('/user/')) {
        return url.split('/user/')[1]?.split('/')[0] || null;
    }
    return null;
};

/**
 * Получает URL миниатюры YouTube видео
 * @param videoId - ID видео
 * @param quality - качество миниатюры
 * @returns URL миниатюры
 */
export const getThumbnailUrl = (
    videoId: string,
    quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string => {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Получает URL YouTube видео
 * @param videoId - ID видео
 * @returns URL видео
 */
export const getVideoUrl = (videoId: string): string => {
    return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Получает URL встраивания YouTube видео
 * @param videoId - ID видео
 * @returns URL для встраивания
 */
export const getEmbedUrl = (videoId: string): string => {
    return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Проверяет, является ли URL валидным YouTube URL
 * @param url - URL для проверки
 * @returns true если это YouTube URL
 */
export const isYouTubeUrl = (url: string): boolean => {
    return extractVideoId(url) !== null || url.includes('youtube.com/') || url.includes('youtu.be/');
};
