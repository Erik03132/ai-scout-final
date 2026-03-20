/**
 * Favorites Component
 * Отображение избранных постов и инструментов
 */

import React, { useState, useMemo } from 'react';
import { useFavorites } from '../../hooks/useFavorites';
import { usePosts } from '../../hooks/usePosts';
import { useTools } from '../../hooks/useTools';
import { PostCard } from '../Feed/PostCard';

type TabType = 'all' | 'posts' | 'tools';

interface FavoritesProps {
    onMentionClick?: (mention: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({ onMentionClick }) => {
    const [activeTab, setActiveTab] = useState<TabType>('all');

    const { favorites, toggleFavorite, isFavorite, clearFavorites } = useFavorites();
    const { posts } = usePosts({ limit: 100 });
    const { tools } = useTools();

    // Фильтруем избранные посты
    const favoritePosts = useMemo(() => {
        return posts.filter(post => isFavorite(post.id));
    }, [posts, isFavorite]);

    // Фильтруем избранные инструменты
    const favoriteTools = useMemo(() => {
        return tools.filter(tool => isFavorite(tool.id));
    }, [tools, isFavorite]);

    const hasFavorites = favorites.length > 0;
    const hasPosts = favoritePosts.length > 0;
    const hasTools = favoriteTools.length > 0;

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>⭐</span> Избранное
                    {favorites.length > 0 && (
                        <span className="text-sm font-normal text-slate-400">
                            ({favorites.length})
                        </span>
                    )}
                </h2>

                {hasFavorites && (
                    <button
                        onClick={() => {
                            if (confirm('Очистить все избранное?')) {
                                clearFavorites();
                            }
                        }}
                        className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        Очистить всё
                    </button>
                )}
            </div>

            {/* Табы */}
            {hasFavorites && (
                <div className="flex gap-2">
                    {([
                        { key: 'all', label: 'Все', count: favorites.length },
                        { key: 'posts', label: 'Посты', count: favoritePosts.length },
                        { key: 'tools', label: 'Инструменты', count: favoriteTools.length }
                    ] as const).map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.key
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {tab.label} ({tab.count})
                        </button>
                    ))}
                </div>
            )}

            {/* Контент */}
            {!hasFavorites ? (
                // Пустое состояние
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">☆</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Пока ничего нет
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto">
                        Добавляйте посты и инструменты в избранное, нажимая на звёздочку
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Посты */}
                    {(activeTab === 'all' || activeTab === 'posts') && hasPosts && (
                        <div>
                            {activeTab === 'all' && (
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <span>📝</span> Посты ({favoritePosts.length})
                                </h3>
                            )}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {favoritePosts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onClick={() => { }}
                                        onMentionClick={onMentionClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Инструменты */}
                    {(activeTab === 'all' || activeTab === 'tools') && hasTools && (
                        <div>
                            {activeTab === 'all' && (
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <span>🔧</span> Инструменты ({favoriteTools.length})
                                </h3>
                            )}
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {favoriteTools.map(tool => (
                                    <ToolFavoriteCard
                                        key={tool.id}
                                        tool={tool}
                                        onRemove={() => toggleFavorite(tool.id, 'tool')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Пустой результат для активного таба */}
                    {activeTab === 'posts' && !hasPosts && (
                        <div className="text-center py-8">
                            <p className="text-slate-400">Нет избранных постов</p>
                        </div>
                    )}
                    {activeTab === 'tools' && !hasTools && (
                        <div className="text-center py-8">
                            <p className="text-slate-400">Нет избранных инструментов</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Компонент карточки избранного инструмента
const ToolFavoriteCard: React.FC<{
    tool: {
        id: string;
        name: string;
        category: string;
        description: string;
        icon: string;
        rating: number;
        docsUrl?: string;
    };
    onRemove: () => void;
}> = ({ tool, onRemove }) => {
    return (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">{tool.icon}</span>
                    <div>
                        <h4 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                            {tool.name}
                        </h4>
                        <p className="text-xs text-slate-400">{tool.category}</p>
                    </div>
                </div>
                <button
                    onClick={onRemove}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                    ★
                </button>
            </div>

            <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                {tool.description}
            </p>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-sm">
                        {'★'.repeat(Math.round(tool.rating))}
                    </span>
                    <span className="text-xs text-slate-400">{tool.rating.toFixed(1)}</span>
                </div>
                {tool.docsUrl && (
                    <a
                        href={tool.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                    >
                        Документация ↗
                    </a>
                )}
            </div>
        </div>
    );
};

export default Favorites;