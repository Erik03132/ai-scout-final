/**
 * PostDetailModal Component
 * Модальное окно с детальной информацией о посте
 */

import React from 'react';
import { Post } from '../../hooks/usePosts';
import { useFavorites } from '../../hooks/useFavorites';

interface PostDetailModalProps {
    post: Post | null;
    isOpen: boolean;
    onClose: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
    post,
    isOpen,
    onClose
}) => {
    const { toggleFavorite, isFavorite } = useFavorites();

    if (!isOpen || !post) return null;

    const sourceIcon = post.source === 'YouTube' ? '🎬' : '📱';
    const sourceColor = post.source === 'YouTube' ? 'text-red-400' : 'text-blue-400';
    const favorite = isFavorite(post.id);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Изображение */}
                {post.image && (
                    <div className="relative aspect-video">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover rounded-t-2xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent" />
                    </div>
                )}

                {/* Контент */}
                <div className="p-6">
                    {/* Заголовок и действия */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className={`text-lg ${sourceColor}`}>{sourceIcon}</span>
                            <span className="text-sm text-slate-400">{post.source}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-sm text-slate-400">{post.channel}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleFavorite(post.id, 'post')}
                                className={`p-2 rounded-lg transition-colors ${favorite
                                        ? 'bg-yellow-500/20 text-yellow-400'
                                        : 'bg-slate-700 text-slate-400 hover:text-yellow-400'
                                    }`}
                            >
                                {favorite ? '★' : '☆'}
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Заголовок */}
                    <h2 className="text-xl font-bold text-white mb-4">{post.title}</h2>

                    {/* Мета информация */}
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-4">
                        <span>📅 {post.date}</span>
                        <span>👁 {post.views} просмотров</span>
                    </div>

                    {/* Саммари */}
                    {post.summary && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Саммари</h3>
                            <p className="text-slate-400 leading-relaxed">{post.summary}</p>
                        </div>
                    )}

                    {/* Детальное использование */}
                    {post.detailedUsage && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Использование</h3>
                            <p className="text-slate-400 leading-relaxed">{post.detailedUsage}</p>
                        </div>
                    )}

                    {/* Советы по использованию */}
                    {post.usageTips && post.usageTips.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Советы</h3>
                            <ul className="space-y-2">
                                {post.usageTips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-2 text-slate-400">
                                        <span className="text-green-400">✓</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Теги */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Теги</h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Упоминания */}
                    {post.mentions && post.mentions.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Упоминания</h3>
                            <div className="flex flex-wrap gap-2">
                                {post.mentions.map((mention, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-lg text-sm border border-blue-700/30"
                                    >
                                        {mention}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ссылка на оригинал */}
                    <div className="pt-4 border-t border-slate-700">
                        <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            Открыть оригинал ↗
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailModal;