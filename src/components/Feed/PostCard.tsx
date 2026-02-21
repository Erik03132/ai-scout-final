/**
 * PostCard Component
 * Карточка поста для отображения в ленте
 */

import React from 'react';
import { Post } from '../../hooks/usePosts';
import { getThumbnailUrl, isYouTubeUrl } from '../../utils/youtubeApi';

interface PostCardProps {
    post: Post;
    isFavorite: boolean;
    onFavoriteToggle: () => void;
    onClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
    isFavorite,
    onFavoriteToggle,
    onClick
}) => {
    // Определяем источник для отображения
    const sourceIcon = post.source === 'YouTube' ? '🎬' : '📱';
    const sourceColor = post.source === 'YouTube' ? 'text-red-400' : 'text-blue-400';

    // Получаем оптимизированное изображение
    const getImageUrl = () => {
        if (post.image) {
            // Если это YouTube миниатюра, используем её напрямую
            if (post.image.includes('img.youtube.com')) {
                return post.image;
            }
            return post.image;
        }
        // Fallback изображение
        return 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
    };

    return (
        <article
            className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group"
            onClick={onClick}
        >
            {/* Изображение */}
            <div className="relative aspect-video overflow-hidden">
                <img
                    src={getImageUrl()}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Источник */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-900/80 text-xs flex items-center gap-1 ${sourceColor}`}>
                    <span>{sourceIcon}</span>
                    <span>{post.source}</span>
                </div>

                {/* Кнопка избранного */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteToggle();
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/80 hover:bg-slate-700 transition-colors"
                >
                    <span className={isFavorite ? 'text-yellow-400' : 'text-slate-400'}>
                        {isFavorite ? '★' : '☆'}
                    </span>
                </button>
            </div>

            {/* Контент */}
            <div className="p-4">
                {/* Канал и дата */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>{post.channel}</span>
                    <span>{post.date}</span>
                </div>

                {/* Заголовок */}
                <h3 className="font-medium text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {post.title}
                </h3>

                {/* Саммари */}
                {post.summary && (
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                        {post.summary}
                    </p>
                )}

                {/* Теги */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-300 rounded"
                            >
                                {tag}
                            </span>
                        ))}
                        {post.tags.length > 3 && (
                            <span className="px-2 py-0.5 text-xs text-slate-500">
                                +{post.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Просмотры */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">
                        👁 {post.views} просмотров
                    </span>
                    <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Открыть ↗
                    </a>
                </div>
            </div>
        </article>
    );
};

export default PostCard;