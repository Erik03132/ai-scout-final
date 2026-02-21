/**
 * Insights Component
 * Аналитика и инсайты по постам и инструментам
 */

import React, { useMemo } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { useTools } from '../../hooks/useTools';

interface InsightsProps {
    onTagClick?: (tag: string) => void;
    onToolClick?: (toolId: string) => void;
}

export const Insights: React.FC<InsightsProps> = ({ onTagClick, onToolClick }) => {
    const { posts, isLoading: postsLoading } = usePosts({ limit: 100 });
    const { tools, isLoading: toolsLoading } = useTools();

    const isLoading = postsLoading || toolsLoading;

    // Аналитика по тегам
    const tagStats = useMemo(() => {
        const tagCounts: Record<string, number> = {};

        posts.forEach(post => {
            post.tags?.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [posts]);

    // Аналитика по источникам
    const sourceStats = useMemo(() => {
        const sources = { YouTube: 0, Telegram: 0 };

        posts.forEach(post => {
            if (post.source === 'YouTube') sources.YouTube++;
            else if (post.source === 'Telegram') sources.Telegram++;
        });

        return sources;
    }, [posts]);

    // Аналитика по каналам
    const channelStats = useMemo(() => {
        const channelCounts: Record<string, number> = {};

        posts.forEach(post => {
            channelCounts[post.channel] = (channelCounts[post.channel] || 0) + 1;
        });

        return Object.entries(channelCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [posts]);

    // Топ инструменты
    const topTools = useMemo(() => {
        return tools.slice(0, 5);
    }, [tools]);

    // Упоминания инструментов
    const mentionStats = useMemo(() => {
        const mentionCounts: Record<string, number> = {};

        posts.forEach(post => {
            post.mentions?.forEach(mention => {
                mentionCounts[mention] = (mentionCounts[mention] || 0) + 1;
            });
        });

        return Object.entries(mentionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [posts]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-white">Инсайты</h2>

            {/* Общая статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon="📝"
                    label="Всего постов"
                    value={posts.length}
                    color="blue"
                />
                <StatCard
                    icon="🎬"
                    label="YouTube"
                    value={sourceStats.YouTube}
                    color="red"
                />
                <StatCard
                    icon="📱"
                    label="Telegram"
                    value={sourceStats.Telegram}
                    color="cyan"
                />
                <StatCard
                    icon="🔧"
                    label="Инструментов"
                    value={tools.length}
                    color="green"
                />
            </div>

            {/* Популярные теги */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>🏷️</span> Популярные теги
                </h3>
                <div className="flex flex-wrap gap-2">
                    {tagStats.map(([tag, count]) => (
                        <button
                            key={tag}
                            onClick={() => onTagClick?.(tag)}
                            className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-lg text-sm text-slate-200 transition-colors flex items-center gap-2"
                        >
                            {tag}
                            <span className="text-xs text-slate-400">({count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Топ каналы */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>📺</span> Топ каналы
                </h3>
                <div className="space-y-3">
                    {channelStats.map(([channel, count], index) => (
                        <div
                            key={channel}
                            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-slate-500">#{index + 1}</span>
                                <span className="text-white">{channel}</span>
                            </div>
                            <span className="text-slate-400">{count} постов</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Упоминания инструментов */}
            {mentionStats.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>🔗</span> Упоминаемые инструменты
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {mentionStats.map(([mention, count]) => (
                            <span
                                key={mention}
                                className="px-3 py-1.5 bg-blue-900/30 border border-blue-700/30 rounded-lg text-sm text-blue-300"
                            >
                                {mention} <span className="text-blue-400/70">({count})</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Топ инструменты */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>⭐</span> Топ инструменты
                </h3>
                <div className="space-y-3">
                    {topTools.map((tool) => (
                        <div
                            key={tool.id}
                            onClick={() => onToolClick?.(tool.id)}
                            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{tool.icon}</span>
                                <div>
                                    <span className="text-white font-medium">{tool.name}</span>
                                    <p className="text-xs text-slate-400">{tool.category}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-400">{'★'.repeat(Math.round(tool.rating))}</span>
                                <span className="text-slate-400">{tool.rating.toFixed(1)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Компонент карточки статистики
const StatCard: React.FC<{
    icon: string;
    label: string;
    value: number;
    color: 'blue' | 'red' | 'cyan' | 'green';
}> = ({ icon, label, value, color }) => {
    const colorClasses = {
        blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
        red: 'from-red-500/20 to-red-600/10 border-red-500/30',
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30'
    };

    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-sm text-slate-400">{label}</div>
        </div>
    );
};

export default Insights;