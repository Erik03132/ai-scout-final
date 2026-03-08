/**
 * ToolDetailModal Component
 * Модальное окно с детальной информацией об инструменте (Premium Redesign)
 */

import React from 'react';
import { Tool } from '../../hooks/useTools';
import { useFavorites } from '../../hooks/useFavorites';
import {
    X,
    Star,
    Zap,
    Clock,
    Heart,
    ExternalLink,
    Code2,
    TerminalSquare
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToolDetailModalProps {
    tool: Tool | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
    tool,
    isOpen,
    onClose
}) => {
    const { toggleFavorite, isFavorite } = useFavorites();

    if (!isOpen || !tool) return null;

    const favorite = isFavorite(tool.id);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-[#0f172a] rounded-[2.5rem] max-w-[550px] w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Content */}
                <div className="p-8 sm:p-10">
                    {/* Header: Icon & Main Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
                        {/* Icon Container with Glow */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-24 h-24 bg-slate-800 rounded-3xl flex items-center justify-center text-5xl shadow-2xl border border-white/5">
                                {tool.icon}
                            </div>
                        </div>

                        {/* Title & Category Area */}
                        <div className="flex-1 text-center sm:text-left pt-2">
                            <div className="flex items-center justify-center sm:justify-start gap-3 mb-3">
                                <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-cyan-500/20">
                                    {tool.category || 'AI Service'}
                                </span>
                                <div className="flex items-center gap-1.5 text-amber-400 font-black text-sm">
                                    <Star size={16} className="fill-current" />
                                    <span>{Number(tool.rating) > 0 ? Number(tool.rating).toFixed(1) : '5.0'}</span>
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none mb-4">
                                {tool.name}
                            </h2>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                {tool.hasApi && (
                                    <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-colors hover:border-white/10">
                                        <Code2 size={12} className="text-blue-400" />
                                        API Access
                                    </span>
                                )}
                                {tool.hasMcp && (
                                    <span className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/5 transition-colors hover:border-white/10">
                                        <TerminalSquare size={12} className="text-emerald-400" />
                                        MCP Ready
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Description Section */}
                        <section className="bg-slate-900/40 p-6 rounded-3xl border border-white/5">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">
                                Обзор инструмента
                            </h3>
                            <p className="text-slate-200 text-base leading-relaxed font-medium whitespace-pre-wrap">
                                {tool.description || "Информация об этом инструменте собирается и будет обновлена в ближайшее время."}
                            </p>
                        </section>

                        {/* Limits Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-white/5 shadow-inner">
                                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                    <Zap size={14} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Дневной лимит
                                    </h3>
                                </div>
                                <p className="text-2xl font-black text-white uppercase tracking-tight">
                                    {tool.dailyCredits || '∞'}
                                </p>
                            </div>

                            <div className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-white/5 shadow-inner">
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                    <Clock size={14} />
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        Месячные кредиты
                                    </h3>
                                </div>
                                <p className="text-2xl font-black text-white uppercase tracking-tight">
                                    {tool.monthlyCredits || '∞'}
                                </p>
                            </div>
                        </div>

                        {/* Pricing Banner */}
                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-[#0f172a] rounded-[2rem] border border-cyan-500/20 relative overflow-hidden group">
                            {/* Inner Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[50px] -mr-10 -mt-10 group-hover:bg-cyan-500/10 transition-all duration-700"></div>

                            <div className="mb-4 sm:mb-0 relative z-10">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                    <Star size={10} className="text-cyan-400" /> Минимальный тариф
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-white tracking-tight">
                                        {(!tool.minPrice || String(tool.minPrice) === '$0' || String(tool.minPrice) === '0') ? 'БЕСПЛАТНО' : tool.minPrice}
                                    </span>
                                    {tool.minPrice && String(tool.minPrice) !== '$0' && !String(tool.minPrice).includes('Бесплатно') && !String(tool.minPrice).includes('Н/Д') && (
                                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest ml-1">/ мес</span>
                                    )}
                                </div>
                            </div>

                            <a
                                href={tool.docsUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-cyan-500/20 active:scale-95 text-xs text-center relative z-10"
                            >
                                Подписаться
                            </a>
                        </div>

                        {/* Benefits/Pros Section */}
                        {Array.isArray(tool.pros) && tool.pros.length > 0 && (
                            <section>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-1">
                                    Ключевые преимущества
                                </h3>
                                <div className="flex flex-wrap gap-2.5">
                                    {tool.pros.map((pro, index) => (
                                        <div
                                            key={index}
                                            className="px-4 py-2 bg-white/5 text-slate-300 rounded-xl text-xs font-bold border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-default flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50"></div>
                                            {String(pro)}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                onClick={() => toggleFavorite(tool.id.toString(), 'tool')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black uppercase tracking-widest transition-all border text-xs",
                                    favorite
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                        : 'bg-slate-800 text-slate-400 border-white/5 hover:bg-slate-700 hover:text-white'
                                )}
                            >
                                <Heart size={18} className={cn(favorite && "fill-current")} />
                                {favorite ? 'В ИЗБРАННОМ' : 'В ИЗБРАННОЕ'}
                            </button>

                            {tool.docsUrl && tool.docsUrl !== '#' && (
                                <a
                                    href={tool.docsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 text-xs"
                                >
                                    ДОКУМЕНТАЦИЯ
                                    <ExternalLink size={18} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetailModal;