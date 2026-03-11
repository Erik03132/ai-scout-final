/**
 * PostCard Component
 * Карточка поста для отображения в ленте
 */

import React from 'react';
import { Post } from '../../hooks/usePosts';

interface PostCardProps {
    post: Post;
    onClick?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
    post,
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
        return '/telegram-placeholder.png';
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
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('maxresdefault.jpg')) {
                            target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                        } else if (target.src.includes('hqdefault.jpg')) {
                            target.src = target.src.replace('hqdefault.jpg', 'mqdefault.jpg');
                        } else if (!target.src.includes('placehold.co')) {
                            target.src = 'https://placehold.co/400x200/1e293b/38bdf8?text=NO+IMAGE';
                        }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />

                {/* Источник */}
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-900/80 text-xs flex items-center gap-1 ${sourceColor}`}>
                    <span>{sourceIcon}</span>
                    <span>{post.source}</span>
                </div>
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

                {/* Теги и Упоминания */}
                <div className="flex flex-wrap items-center gap-1.5">
                    {post.tags && post.tags.slice(0, 3).map((tag, index) => (
                        <span
                            key={`tag-${index}`}
                            className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-300 rounded"
                        >
                            {tag}
                        </span>
                    ))}
                    {post.tags && post.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-xs text-slate-500">
                            +{post.tags.length - 3}
                        </span>
                    )}

                    {post.is_analyzed === false ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-medium ml-1">
                            <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            AI-Анализ в очереди...
                        </div>
                    ) : post.mentions && post.mentions.length > 0 ? (
                        <>
                            <span className="text-slate-600">|</span>
                            {post.mentions.slice(0, 3).map((mention, index) => {
                                const getIcon = (name: string) => {
                                    const n = name.toLowerCase();
                                    if (n.includes('gemini')) return '♊';
                                    if (n.includes('gpt') || n.includes('chatgpt') || n.includes('openai')) return '🤖';
                                    if (n.includes('claude') || n.includes('anthropic')) return '🎭';
                                    if (n.includes('midjourney')) return '🎨';
                                    if (n.includes('cursor')) return '🖥️';
                                    if (n.includes('bolt') || n.includes('lovable')) return '⚡';
                                    if (n.includes('v0')) return '🚀';
                                    if (n.includes('perplexity')) return '🔍';
                                    return '✨';
                                };
                                return (
                                    <span
                                        key={`mention-${index}`}
                                        className="px-2 py-0.5 text-[10px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-medium flex items-center gap-1"
                                    >
                                        {getIcon(mention)} {mention}
                                    </span>
                                );
                            })}
                            {post.mentions.length > 3 && (
                                <span className="px-2 py-0.5 text-[10px] text-slate-500">
                                    +{post.mentions.length - 3}
                                </span>
                            )}
                        </>
                    ) : null}
                </div>

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