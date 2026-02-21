/**
 * Хук для работы с избранным
 * Управление избранными постами и инструментами с сохранением в localStorage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface FavoriteItem {
    id: string | number;
    type: 'post' | 'tool';
    addedAt: string;
}

interface UseFavoritesReturn {
    favorites: FavoriteItem[];
    addFavorite: (id: string | number, type: 'post' | 'tool') => void;
    removeFavorite: (id: string | number) => void;
    toggleFavorite: (id: string | number, type: 'post' | 'tool') => void;
    isFavorite: (id: string | number) => boolean;
    clearFavorites: () => void;
    favoritePosts: string[];
    favoriteTools: string[];
    favoritesCount: number;
}

const STORAGE_KEY = 'ai-scout-favorites';

/**
 * Хук для управления избранным
 */
export const useFavorites = (): UseFavoritesReturn => {
    const [storedFavorites, setStoredFavorites] = useLocalStorage<FavoriteItem[]>(
        STORAGE_KEY,
        []
    );

    const [favorites, setFavorites] = useState<FavoriteItem[]>(storedFavorites);

    // Синхронизация с localStorage
    useEffect(() => {
        setFavorites(storedFavorites);
    }, [storedFavorites]);

    /**
     * Добавляет элемент в избранное
     */
    const addFavorite = useCallback((id: string | number, type: 'post' | 'tool') => {
        setStoredFavorites(prev => {
            const exists = prev.some(item => item.id === id);
            if (exists) return prev;

            return [
                ...prev,
                { id, type, addedAt: new Date().toISOString() }
            ];
        });
    }, [setStoredFavorites]);

    /**
     * Удаляет элемент из избранного
     */
    const removeFavorite = useCallback((id: string | number) => {
        setStoredFavorites(prev => prev.filter(item => item.id !== id));
    }, [setStoredFavorites]);

    /**
     * Переключает статус избранного
     */
    const toggleFavorite = useCallback((id: string | number, type: 'post' | 'tool') => {
        setStoredFavorites(prev => {
            const exists = prev.some(item => item.id === id);

            if (exists) {
                return prev.filter(item => item.id !== id);
            }

            return [
                ...prev,
                { id, type, addedAt: new Date().toISOString() }
            ];
        });
    }, [setStoredFavorites]);

    /**
     * Проверяет, находится ли элемент в избранном
     */
    const isFavorite = useCallback((id: string | number): boolean => {
        return favorites.some(item => item.id === id);
    }, [favorites]);

    /**
     * Очищает все избранное
     */
    const clearFavorites = useCallback(() => {
        setStoredFavorites([]);
    }, [setStoredFavorites]);

    // Мемоизированные списки по типам
    const favoritePosts = useMemo(() => {
        return favorites
            .filter(item => item.type === 'post')
            .map(item => String(item.id));
    }, [favorites]);

    const favoriteTools = useMemo(() => {
        return favorites
            .filter(item => item.type === 'tool')
            .map(item => String(item.id));
    }, [favorites]);

    const favoritesCount = favorites.length;

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        favoritePosts,
        favoriteTools,
        favoritesCount
    };
};

/**
 * Хук для фильтрации постов по избранному
 */
export const useFavoritePostsFilter = (allPosts: any[]) => {
    const { favoritePosts, isFavorite } = useFavorites();

    const favoritePostsList = useMemo(() => {
        return allPosts.filter(post => isFavorite(post.id));
    }, [allPosts, isFavorite]);

    return { favoritePostsList, favoritePosts };
};

/**
 * Хук для фильтрации инструментов по избранному
 */
export const useFavoriteToolsFilter = (allTools: any[]) => {
    const { favoriteTools, isFavorite } = useFavorites();

    const favoriteToolsList = useMemo(() => {
        return allTools.filter(tool => isFavorite(tool.id));
    }, [allTools, isFavorite]);

    return { favoriteToolsList, favoriteTools };
};
