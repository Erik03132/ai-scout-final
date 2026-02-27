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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0f1c]/80 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-[#111827] rounded-3xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Кнопка закрытия */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-8">
                    {/* Заголовок и иконка */}
                    <div className="flex items-start gap-5 mb-8">
                        {/* Иконка */}
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-slate-700/50">
                            {tool.icon}
                        </div>

                        {/* Информация */}
                        <div className="flex flex-col items-start pt-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-cyan-900/40 text-cyan-400 rounded-full text-xs font-bold uppercase tracking-wider border border-cyan-800/50">
                                    {tool.category}
                                </span>
                                <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm">
                                    <Star size={14} className="fill-current" />
                                    <span>{tool.rating.toFixed(1)}</span>
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                {tool.name}
                            </h2>

                            <div className="flex gap-2">
                                {tool.hasApi && (
                                    <span className="px-3 py-1 bg-indigo-900/40 text-indigo-300 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-indigo-800/50">
                                        <Code2 size={12} />
                                        API Access
                                    </span>
                                )}
                                {tool.hasMcp && (
                                    <span className="px-3 py-1 bg-purple-900/40 text-purple-300 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border border-purple-800/50">
                                        <TerminalSquare size={12} />
                                        MCP Support
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Описание */}
                    <div className="mb-8">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                            Описание
                        </h3>
                        <p className="text-slate-200 text-lg leading-relaxed font-medium">
                            {tool.description}
                        </p>
                    </div>

                    {/* Лимиты и квоты (Квадратные карточки) */}
                    {(tool.dailyCredits !== undefined || tool.monthlyCredits !== undefined) && (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {tool.dailyCredits !== undefined ? (
                                <div className="p-5 bg-[#172033] rounded-2xl border border-slate-800/60">
                                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                        <Zap size={14} />
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Daily Limit
                                        </h3>
                                    </div>
                                    <p className="text-2xl font-black text-white">
                                        {tool.dailyCredits}
                                    </p>
                                </div>
                            ) : <div />}

                            {tool.monthlyCredits !== undefined ? (
                                <div className="p-5 bg-[#172033] rounded-2xl border border-slate-800/60">
                                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                        <Clock size={14} />
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            Monthly Credits
                                        </h3>
                                    </div>
                                    <p className="text-2xl font-black text-white">
                                        {tool.monthlyCredits}
                                    </p>
                                </div>
                            ) : <div />}
                        </div>
                    )}

                    {/* Минимальный тариф (Широкая карточка) */}
                    {tool.minPrice !== undefined && (
                        <div className="flex items-center justify-between p-6 bg-[#131d2f]/80 rounded-2xl border border-slate-700/50 mb-8">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Минимальный тариф
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-[#00E599]">
                                        {tool.minPrice === "$0" || tool.minPrice === 0 ? 'Бесплатно' : (typeof tool.minPrice === 'number' ? `$${tool.minPrice}` : tool.minPrice)}
                                    </span>
                                    {tool.minPrice !== "$0" && tool.minPrice !== 0 && tool.minPrice !== "Бесплатно" && tool.minPrice !== "Н/Д" && (
                                        <span className="text-slate-400 text-sm font-medium">/мес</span>
                                    )}
                                </div>
                            </div>

                            <a
                                href={tool.docsUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-gradient-to-r from-[#00E599] to-[#00C885] hover:from-[#00faad] hover:to-[#00db95] text-slate-900 font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:shadow-[0_0_25px_rgba(0,229,153,0.5)] active:scale-95"
                            >
                                Подписаться
                            </a>
                        </div>
                    )}

                    {/* Особенности */}
                    {tool.pros && tool.pros.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                Ключевые особенности (кликабельно)
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {tool.pros.map((pro, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-slate-700/50 transition-colors cursor-pointer"
                                    >
                                        {pro}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Нижние кнопки-действия */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => toggleFavorite(tool.id, 'tool')}
                            className={`flex flex-1 items-center justify-center gap-2 px-5 py-4 rounded-xl font-bold transition-all border ${favorite
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                                }`}
                        >
                            <Heart size={18} className={favorite ? "fill-current" : ""} />
                            {favorite ? 'В ИЗБРАННОМ' : 'В ИЗБРАННОЕ'}
                        </button>

                        {tool.docsUrl && (
                            <a
                                href={tool.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 shadow-lg shadow-blue-500/20 items-center justify-center gap-2 px-5 py-4 bg-[#0070F3] hover:bg-[#0061d5] text-white rounded-xl font-bold transition-colors"
                            >
                                ДОКУМЕНТАЦИЯ
                                <ExternalLink size={18} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetailModal;