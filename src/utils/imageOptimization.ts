/**
 * Утилиты для оптимизации изображений
 * Функции для работы с Unsplash, YouTube и другими источниками изображений
 */

/**
 * Параметры оптимизации изображений
 */
interface ImageOptimizationParams {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    fit?: 'crop' | 'fill' | 'scale';
}

/**
 * Оптимизирует URL изображения Unsplash
 * @param url - Базовый URL Unsplash
 * @param params - Параметры оптимизации
 * @returns Оптимизированный URL
 */
export const optimizeUnsplashImage = (
    url: string,
    params: ImageOptimizationParams = {}
): string => {
    const { width = 400, height = 200, quality = 80, format = 'auto', fit = 'crop' } = params;

    // Если URL уже содержит параметры, добавляем к существующим
    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}auto=format&fit=${fit}&q=${quality}&w=${width}&h=${height}`;
};

/**
 * Массив AI-тематических изображений из Unsplash
 */
export const aiThemedImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995', // AI Robot
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485', // Neural Network
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349', // AI Brain
    'https://images.unsplash.com/photo-1655635949384-f737c5133dfe', // Machine Learning
    'https://images.unsplash.com/photo-1555255707-c07966088b7b', // Technology
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e', // Robot
];

/**
 * Получает случайное AI-тематическое изображение
 * @param params - Параметры оптимизации
 * @returns Оптимизированный URL изображения
 */
export const getRandomAiImage = (params: ImageOptimizationParams = {}): string => {
    const randomIndex = Math.floor(Math.random() * aiThemedImages.length);
    const baseUrl = aiThemedImages[randomIndex];
    return optimizeUnsplashImage(baseUrl, params);
};

/**
 * Получает оптимизированную миниатюру YouTube
 * @param videoId - ID видео YouTube
 * @param quality - Качество миниатюры
 * @returns URL миниатюры
 */
export const getOptimizedYouTubeThumbnail = (
    videoId: string,
    quality: 'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault' = 'hqdefault'
): string => {
    // YouTube предоставляет разные размеры миниатюр:
    // default: 120x90
    // mqdefault: 320x180
    // hqdefault: 480x360
    // sddefault: 640x480
    // maxresdefault: 1280x720 (не всегда доступен)
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Предзагружает изображение
 * @param src - URL изображения
 * @returns Promise, который разрешается при загрузке изображения
 */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
};

/**
 * Проверяет, является ли URL изображением Unsplash
 * @param url - URL для проверки
 * @returns true если это Unsplash URL
 */
export const isUnsplashUrl = (url: string): boolean => {
    return url.includes('images.unsplash.com');
};

/**
 * Проверяет, является ли URL миниатюрой YouTube
 * @param url - URL для проверки
 * @returns true если это YouTube миниатюра
 */
export const isYouTubeThumbnail = (url: string): boolean => {
    return url.includes('img.youtube.com');
};

/**
 * Получает srcset для адаптивных изображений
 * @param baseUrl - Базовый URL изображения
 * @param widths - Массив ширин
 * @returns Строка srcset
 */
export const generateSrcSet = (
    baseUrl: string,
    widths: number[] = [320, 640, 768, 1024, 1280]
): string => {
    return widths
        .map(width => `${optimizeUnsplashImage(baseUrl, { width })} ${width}w`)
        .join(', ');
};
