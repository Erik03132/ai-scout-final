import React, { useState, useMemo } from 'react';
import { Heart, Zap, Clock, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';

const categories = ["All", "Deployment", "Database", "Design", "ORM", "CSS", "State", "Framework", "Payments"];

interface ArchiveTabProps {
    tools: any[];
    favorites: string[];
    toggleFavorite: (id: string) => void;
    setSelectedTool?: (tool: any) => void;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = ({
    tools,
    favorites,
    toggleFavorite,
    setSelectedTool
}) => {
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredTools = useMemo(() =>
        selectedCategory === 'All'
            ? tools
            : tools.filter(tool => tool.category === selectedCategory),
        [tools, selectedCategory]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Архив инструментов</h2>
                    <p className="text-slate-400 text-sm mt-1">Каталог технологий и сервисов с AI-анализом</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">{filteredTools.length} инструментов</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                            selectedCategory === cat
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTools.map(tool => (
                    <div
                        key={tool.id}
                        onClick={() => setSelectedTool?.(tool)}
                        className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-[2.5rem] p-7 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col h-full relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-20 h-20 bg-cyan-500/10 blur-3xl rounded-full" />
                        </div>

                        <div className="flex items-start justify-between mb-6 relative">
                            <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 shadow-xl rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                {tool.icon}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(`tool-${tool.id}`);
                                }}
                                className={cn(
                                    "p-3 rounded-2xl transition-all duration-300 border backdrop-blur-md",
                                    favorites.includes(`tool-${tool.id}`)
                                        ? "text-red-400 bg-red-500/10 border-red-500/20 shadow-lg shadow-red-500/10"
                                        : "text-slate-500 hover:text-red-400 hover:bg-slate-700/50 border-white/5"
                                )}
                            >
                                <Heart className={cn("w-6 h-6", favorites.includes(`tool-${tool.id}`) && "fill-current")} />
                            </button>
                        </div>

                        <div className="mb-5 relative">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                                    {tool.category}
                                </span>
                                <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                    ★ {tool.rating}
                                </div>
                            </div>
                            <h3 className="font-black text-2xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight leading-none mb-3">
                                {tool.name}
                            </h3>
                        </div>

                        <p className="text-sm text-slate-400 leading-relaxed mb-6 flex-grow line-clamp-3 font-medium">
                            {tool.description}
                        </p>

                        {(tool.dailyCredits !== undefined || tool.monthlyCredits !== undefined) && (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {tool.dailyCredits !== undefined ? (
                                    <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-cyan-500/20 transition-colors">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Zap size={12} className="text-cyan-400" /> Daily
                                        </p>
                                        <p className="text-sm font-black text-white">{tool.dailyCredits}</p>
                                    </div>
                                ) : <div />}

                                {tool.monthlyCredits !== undefined ? (
                                    <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 hover:border-blue-500/20 transition-colors">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <Clock size={12} className="text-blue-400" /> Monthly
                                        </p>
                                        <p className="text-sm font-black text-white">{tool.monthlyCredits}</p>
                                    </div>
                                ) : <div />}
                            </div>
                        )}

                        {tool.details && tool.details.length > 0 && (
                            <div className="space-y-2.5 mb-8">
                                {tool.details.slice(0, 3).map((detail: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-xs text-slate-300 font-semibold group-hover:text-white transition-colors">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 shadow-sm" />
                                        {detail.title}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-slate-700/50 flex items-end justify-between">
                            <div className="space-y-1.5">
                                {tool.minPrice !== undefined && (
                                    <>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Plan</p>
                                        <p className="text-xl font-black text-emerald-400 tracking-tighter">
                                            {tool.minPrice === "$0" || tool.minPrice === 0 ? 'Бесплатно' : tool.minPrice}
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {tool.hasApi && (
                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">API</div>
                                )}
                                {tool.hasMcp && (
                                    <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-tighter">MCP</div>
                                )}
                            </div>
                        </div>

                        <button className="mt-7 w-full h-14 bg-gradient-to-r from-slate-700/50 to-slate-800/50 hover:from-cyan-500 hover:to-blue-600 hover:text-white text-slate-300 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-3 border border-white/5 hover:border-transparent hover:shadow-xl hover:shadow-blue-500/20">
                            Открыть в Scout <ExternalLink size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
