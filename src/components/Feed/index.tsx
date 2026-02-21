/**
 * Feed Component
 * Отображение ленты постов с фильтрацией и пагинацией
 * Поддерживает виртуализацию для больших списков
 */

import React, { useState, useMemo } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { useFavorites } from '../../hooks/useFavorites';
import { PostCard } from './PostCard';
import { PostFilters } from './PostFilters';
import { VirtualizedFeed } from './VirtualizedFeed';

interface FeedProps {
    onPostClick?: (postId: number) => void;
    /** Использовать виртуализацию (автоматически включается при > 50 постов) */
    virtualized?: boolean;
    /** Высота виртуализированного списка */
    listHeight?: number;
}

// Порог для автоматического включения виртуализации
const VIRTUALIZATION_THRESHOLD = 50;

export const Feed: React.FC<FeedProps> = ({
    onPostClick,
    virtualized,
    listHeight = 600
}) => {
    const [source, setSource] = useState<'YouTube' | 'Telegram' | 'all'>('all');
    const [selectedTag, setSelectedTag] = useState<string | undefined>();

    const { posts, isLoading, error, hasMore, loadMore, refetch } = usePosts({
        source,
        tag: selectedTag
    });

    const { toggleFavorite, isFavorite } = useFavorites();

    // Определяем, нужно ли использовать виртуализацию
    const shouldVirtualize = useMemo(() => {
        if (virtualized !== undefined) return virtualized;
        return posts.length > VIRTUALIZATION_THRESHOLD;
    }, [virtualized, posts.length]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-red-400 mb-4">Ошибка загрузки: {error}</p>
                <button
                    onClick={refetch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Фильтры */}
            <PostFilters
                source={source}
                onSourceChange={setSource}
                selectedTag={selectedTag}
                onTagChange={setSelectedTag}
            />

            {/* Счётчик постов */}
            <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Найдено: {posts.length} постов</span>
                {shouldVirtualize && (
                    <span className="text-xs text-slate-500">
                        Виртуализация включена
                    </span>
                )}
            </div>

            {/* Лента постов */}
            {shouldVirtualize ? (
                // Виртуализированный список для больших объёмов данных
                <VirtualizedFeed
                    posts={posts}
                    height={listHeight}
                    onPostClick={onPostClick}
                />
            ) : (
                // Обычная сетка для небольших списков
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            isFavorite={isFavorite(post.id)}
                            onFavoriteToggle={() => toggleFavorite(post.id, 'post')}
                            onClick={() => onPostClick?.(post.id)}
                        />
                    ))}
                </div>
            )}

            {/* Состояние загрузки */}
            {isLoading && (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Кнопка загрузки ещё */}
            {!isLoading && hasMore && !shouldVirtualize && (
                <div className="flex justify-center">
                    <button
                        onClick={loadMore}
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                    >
                        Загрузить ещё
                    </button>
                </div>
            )}

            {/* Пустое состояние */}
            {!isLoading && posts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">Нет постов для отображения</p>
                </div>
            )}
        </div>
    );
};

export default Feed;