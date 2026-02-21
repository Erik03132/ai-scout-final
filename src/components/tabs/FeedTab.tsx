/**
 * FeedTab Component
 * Вкладка с лентой новостей
 */

import React from 'react';
import { Clock, ExternalLink, FileText, Heart, MessageCircle, Youtube } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Post {
    id: number;
    title: string;
    summary: string;
    source: string;
    channel: string;
    date: string;
    tags: string[];
    mentions: string[];
    views: string;
    image: string;
    url: string;
    detailedUsage: string;
    usageTips: string[];
    content?: string;
}

export interface Tool {
    id: number | string;
    name: string;
    icon?: string;
    category: string;
}

interface FeedTabProps {
    posts: Post[];
    tools: Tool[];
    favorites: string[];
    onToggleFavorite: (id: string) => void;
    onSelectPost: (post: Post) => void;
    onSelectTool: (tool: Tool) => void;
}

export const FeedTab: React.FC<FeedTabProps> = ({
    posts,
    tools,
    favorites,
    onToggleFavorite,
    onSelectPost,
    onSelectTool
}) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Последние новости</h2>
                    <p className="text-slate-400 text-sm mt-1">AI-анализ контента из ваших источников</p>
                </div>
                <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Фильтры
                </button>
            </div>

            <div className="grid gap-4">
                {posts.map(post => (
                    <div
                        key={post.id}
                        className="group bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-6 mb-4 hover:border-cyan-500/50 hover:bg-slate-800/90 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1"
                    >
                        <div className="flex flex-col sm:flex-row gap-4">
                            <img
                                src={post.image}
                                alt={post.title}
                                loading="lazy"
                                className="w-full sm:w-40 h-48 sm:h-28 object-cover rounded-xl flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn(
                                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                        post.source === 'YouTube'
                                            ? "bg-red-500/10 text-red-400"
                                            : "bg-sky-500/10 text-sky-400"
                                    )}>
                                        {post.source === 'YouTube' ? <Youtube className="w-3 h-3" /> : <MessageCircle className="w-3 h-3" />}
                                        {post.source}
                                    </span>
                                    <span className="text-xs text-slate-500">{post.channel}</span>
                                    <span className="text-xs text-slate-600">•</span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {post.date}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-auto">{post.views} просмотров</span>
                                </div>

                                <h3 className="font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors cursor-pointer">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-3">{post.summary}</p>

                                <div className="flex items-center gap-3">
                                    <div className="flex flex-wrap gap-1.5">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded-full text-xs">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {post.mentions.length > 0 && (
                                        <>
                                            <span className="text-slate-600">|</span>
                                            <span className="text-xs text-slate-500">Упомянуто:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {post.mentions.map(toolName => {
                                                    const toolObj = tools.find(t => t.name === toolName);
                                                    return (
                                                        <button
                                                            key={toolName}
                                                            onClick={() => toolObj && onSelectTool(toolObj)}
                                                            className={cn(
                                                                "px-2 py-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-xs font-medium transition-all",
                                                                toolObj ? "hover:border-cyan-400 hover:scale-105 cursor-pointer" : "opacity-50 cursor-default"
                                                            )}
                                                        >
                                                            {toolObj?.icon} {toolName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-cyan-500/20"
                                    title="Открыть источник"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </a>
                                <button
                                    onClick={() => onSelectPost(post)}
                                    className="p-2 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 transition-all border border-transparent hover:border-blue-500/20"
                                    title="Подробный саммари"
                                >
                                    <FileText className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onToggleFavorite(`post-${post.id}`)}
                                    className={cn(
                                        "p-2 rounded-xl transition-all duration-200 border",
                                        favorites.includes(`post-${post.id}`)
                                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                                            : "text-slate-500 hover:text-red-400 hover:bg-slate-700/50 border-transparent"
                                    )}
                                >
                                    <Heart className={cn("w-5 h-5", favorites.includes(`post-${post.id}`) && "fill-current")} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeedTab;
