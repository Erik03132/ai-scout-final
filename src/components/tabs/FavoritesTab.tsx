import React from 'react';
import { Heart, Wrench, TrendingUp, Zap, Clock, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FavoritesTabProps {
    favoriteTools: any[];
    favoritePosts: any[];
    toggleFavorite: (id: string) => void;
}

export const FavoritesTab: React.FC<FavoritesTabProps> = ({
    favoriteTools,
    favoritePosts,
    toggleFavorite
}) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Ваше избранное</h2>
                <p className="text-slate-400 text-sm mt-1">Сохраненные новости и инструменты</p>
            </div>

            {favoriteTools.length === 0 && favoritePosts.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                    <Heart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-400">Список пуст</h3>
                    <p className="text-slate-500 text-sm mt-2">Добавляйте инструменты и новости в избранное, чтобы они появились здесь</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {favoriteTools.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <Wrench className="w-5 h-5 text-cyan-400" />
                                Инструменты
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {favoriteTools.map(tool => (
                                    <div
                                        key={tool.id}
                                        className="group bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-[2.5rem] p-7 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-14 h-14 bg-slate-700/50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                                                {tool.icon}
                                            </div>
                                            <button
                                                onClick={() => toggleFavorite(`tool-${tool.id}`)}
                                                className="p-3 rounded-2xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200 border border-red-500/20 shadow-lg shadow-red-500/5"
                                            >
                                                <Heart className="w-5 h-5 fill-current" />
                                            </button>
                                        </div>
                                        <h3 className="font-black text-xl text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{tool.name}</h3>
                                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest mb-4 inline-block border border-cyan-500/20">
                                            {tool.category}
                                        </span>
                                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-6 font-medium">{tool.description}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Zap size={10} /> {tool.dailyCredits}</p>
                                            </div>
                                            <div className="bg-slate-900/40 rounded-xl p-3 border border-white/5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} /> {tool.monthlyCredits}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-6 border-t border-slate-700/50 mt-auto">
                                            <div className="space-y-0.5">
                                                <p className="text-[9px] font-black text-slate-500 uppercase">Tariff</p>
                                                <p className="text-lg font-black text-emerald-400">{tool.minPrice}</p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {tool.hasApi && <span className="bg-blue-400/10 text-blue-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-blue-500/20">API</span>}
                                                {tool.hasMcp && <span className="bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border border-emerald-500/20">MCP</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {favoritePosts.length > 0 && (
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                Новости и посты
                            </h3>
                            <div className="grid gap-4">
                                {favoritePosts.map(post => (
                                    <div
                                        key={post.id}
                                        className="group bg-gradient-to-br from-slate-800/80 to-slate-800/40 backdrop-blur-sm border-2 border-slate-700 rounded-2xl p-6"
                                    >
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <img src={post.image} alt={post.title} loading="lazy" className="w-full sm:w-32 h-40 sm:h-20 object-cover rounded-xl flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white mb-1">{post.title}</h3>
                                                <p className="text-sm text-slate-400 line-clamp-1">{post.summary}</p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className="text-xs text-slate-500">{post.channel}</span>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <a
                                                            href={post.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-amber-500 hover:text-amber-400 transition-colors"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                        <button
                                                            onClick={() => toggleFavorite(`post-${post.id}`)}
                                                            className="text-red-400 text-xs font-medium hover:underline"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
};
