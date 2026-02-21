/**
 * VirtualizedFeed Component
 * Виртуализированная лента постов с использованием react-window
 * для оптимизации производительности при большом количестве постов
 */

import React, { useCallback } from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Post } from '../../hooks/usePosts';
import { useFavorites } from '../../hooks/useFavorites';

interface VirtualizedFeedProps {
    posts: Post[];
    width?: number | string;
    height?: number;
    itemHeight?: number;
    onPostClick?: (postId: number) => void;
}

// Внутренний компонент карточки для виртуализации
const VirtualizedPostCard: React.FC<{
    post: Post;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    onClick?: () => void;
}> = ({ post, isFavorite, onFavoriteToggle, onClick }) => {
    const sourceIcon = post.source === 'YouTube' ? '🎬' : '📱';
    const sourceColor = post.source === 'YouTube' ? 'text-red-400' : 'text-blue-400';

    const getImageUrl = () => {
        if (post.image) return post.image;
        return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
    };

    return (
        <article
            className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group mx-2"
            onClick={onClick}
        >
            <div className="flex gap-4 p-4">
                {/* Миниатюра */}
                <div className="relative w-40 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                        src={getImageUrl()}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs bg-slate-900/80 ${sourceColor}`}>
                        {sourceIcon}
                    </div>
                </div>

                {/* Контент */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>{post.channel}</span>
                        <span>{post.date}</span>
                    </div>

                    <h3 className="font-medium text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors text-sm">
                        {post.title}
                    </h3>

                    {post.summary && (
                        <p className="text-xs text-slate-400 line-clamp-1">
                            {post.summary}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">
                            👁 {post.views}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFavoriteToggle();
                            }}
                            className={`text-sm ${isFavorite ? 'text-yellow-400' : 'text-slate-400 hover:text-yellow-400'}`}
                        >
                            {isFavorite ? '★' : '☆'}
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export const VirtualizedFeed: React.FC<VirtualizedFeedProps> = ({
    posts,
    width = '100%',
    height = 600,
    itemHeight = 120,
    onPostClick
}) => {
    const { toggleFavorite, isFavorite } = useFavorites();

    // Row renderer для react-window
    const Row = useCallback(
        ({ index, style }: ListChildComponentProps) => {
            const post = posts[index];
            return (
                <div style={style}>
                    <VirtualizedPostCard
                        post={post}
                        isFavorite={isFavorite(post.id)}
                        onFavoriteToggle={() => toggleFavorite(post.id, 'post')}
                        onClick={() => onPostClick?.(post.id)}
                    />
                </div>
            );
        },
        [posts, isFavorite, toggleFavorite, onPostClick]
    );

    return (
        <FixedSizeList
            height={height}
            width={width}
            itemCount={posts.length}
            itemSize={itemHeight}
            overscanCount={5}
        >
            {Row}
        </FixedSizeList>
    );
};

export default VirtualizedFeed;