/**
 * Archive Component
 * Архив постов с поиском и фильтрацией по дате
 */

import React, { useState, useMemo } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { PostCard } from '../Feed/PostCard';
import { useFavorites } from '../../hooks/useFavorites';

interface ArchiveProps {
    onPostClick?: (postId: number) => void;
}

export const Archive: React.FC<ArchiveProps> = ({ onPostClick }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const { posts, isLoading, error } = usePosts({ limit: 100 });
    const { toggleFavorite, isFavorite } = useFavorites();

    // Группировка постов по месяцам
    const postsByMonth = useMemo(() => {
        const grouped: Record<string, typeof posts> = {};

        posts.forEach(post => {
            const month = post.date || 'Без даты';
            if (!grouped[month]) {
                grouped[month] = [];
            }
            grouped[month].push(post);
        });

        return grouped;
    }, [posts]);

    // Фильтрация по поиску
    const filteredPosts = useMemo(() => {
        if (!searchQuery.trim()) return posts;

        const query = searchQuery.toLowerCase();
        return posts.filter(post =>
            post.title.toLowerCase().includes(query) ||
            post.summary.toLowerCase().includes(query) ||
            post.channel.toLowerCase().includes(query)
        );
    }, [posts, searchQuery]);

    // Получаем список месяцев
    const months = useMemo(() => Object.keys(postsByMonth), [postsByMonth]);

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">Ошибка загрузки архива</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и поиск */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Архив</h2>

                <div className="flex gap-4 w-full md:w-auto">
                    {/* Поиск */}
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Поиск в архиве..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Навигация по месяцам */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setSelectedMonth(null)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!selectedMonth
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    Все
                </button>
                {months.map((month) => (
                    <button
                        key={month}
                        onClick={() => setSelectedMonth(month)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedMonth === month
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {month} ({postsByMonth[month].length})
                    </button>
                ))}
            </div>

            {/* Результаты поиска или архив по месяцам */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : searchQuery ? (
                // Результаты поиска
                <div>
                    <p className="text-slate-400 mb-4">
                        Найдено: {filteredPosts.length} результатов
                    </p>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                isFavorite={isFavorite(post.id)}
                                onFavoriteToggle={() => toggleFavorite(post.id, 'post')}
                                onClick={() => onPostClick?.(post.id)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                // Архив по месяцам
                <div className="space-y-8">
                    {(selectedMonth ? [selectedMonth] : months).map(month => (
                        <div key={month}>
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="text-blue-400">📅</span>
                                {month}
                                <span className="text-sm text-slate-400">
                                    ({postsByMonth[month].length} постов)
                                </span>
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {postsByMonth[month].map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        isFavorite={isFavorite(post.id)}
                                        onFavoriteToggle={() => toggleFavorite(post.id, 'post')}
                                        onClick={() => onPostClick?.(post.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Пустое состояние */}
            {!isLoading && posts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-400">Архив пуст</p>
                </div>
            )}
        </div>
    );
};

export default Archive;