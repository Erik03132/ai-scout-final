/**
 * PostFilters Component
 * Фильтры для ленты постов
 */

import React from 'react';

interface PostFiltersProps {
    source: 'YouTube' | 'Telegram' | 'all';
    onSourceChange: (source: 'YouTube' | 'Telegram' | 'all') => void;
    selectedTag?: string;
    onTagChange: (tag?: string) => void;
}

const popularTags = [
    'AI', 'React', 'Next.js', 'TypeScript', 'Python',
    'Machine Learning', 'API', 'DevOps', 'Cloud'
];

export const PostFilters: React.FC<PostFiltersProps> = ({
    source,
    onSourceChange,
    selectedTag,
    onTagChange
}) => {
    return (
        <div className="space-y-4">
            {/* Фильтр по источнику */}
            <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400 mr-2">Источник:</span>
                {(['all', 'YouTube', 'Telegram'] as const).map((s) => (
                    <button
                        key={s}
                        onClick={() => onSourceChange(s)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${source === s
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {s === 'all' ? 'Все' : s}
                    </button>
                ))}
            </div>

            {/* Фильтр по тегам */}
            <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400 mr-2">Теги:</span>
                <button
                    onClick={() => onTagChange(undefined)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${!selectedTag
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    Все
                </button>
                {popularTags.map((tag) => (
                    <button
                        key={tag}
                        onClick={() => onTagChange(tag)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedTag === tag
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default PostFilters;