/**
 * ToolDetailModal Component
 * Модальное окно с детальной информацией об инструменте
 */

import React from 'react';
import { Tool } from '../../hooks/useTools';
import { useFavorites } from '../../hooks/useFavorites';

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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Контент */}
                <div className="p-6">
                    {/* Заголовок и действия */}
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <span className="text-5xl">{tool.icon}</span>
                            <div>
                                <h2 className="text-xl font-bold text-white">{tool.name}</h2>
                                <p className="text-sm text-slate-400">{tool.category}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => toggleFavorite(tool.id, 'tool')}
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

                    {/* Рейтинг */}
                    <div className="flex items-center gap-2 mb-6">
                        <span className="text-yellow-400 text-lg">
                            {'★'.repeat(Math.round(tool.rating))}
                            {'☆'.repeat(5 - Math.round(tool.rating))}
                        </span>
                        <span className="text-slate-400">{tool.rating.toFixed(1)}</span>
                    </div>

                    {/* Описание */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Описание</h3>
                        <p className="text-slate-400 leading-relaxed">{tool.description}</p>
                    </div>

                    {/* Преимущества */}
                    {tool.pros && tool.pros.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-slate-300 mb-2">Преимущества</h3>
                            <ul className="space-y-2">
                                {tool.pros.map((pro, index) => (
                                    <li key={index} className="flex items-start gap-2 text-slate-400">
                                        <span className="text-green-400">✓</span>
                                        {pro}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Цены */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Цены</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {tool.dailyCredits !== undefined && (
                                <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-1">Бесплатные кредиты/день</p>
                                    <p className="text-lg font-semibold text-white">{tool.dailyCredits}</p>
                                </div>
                            )}
                            {tool.monthlyCredits !== undefined && (
                                <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-1">Бесплатные кредиты/месяц</p>
                                    <p className="text-lg font-semibold text-white">{tool.monthlyCredits}</p>
                                </div>
                            )}
                            {tool.minPrice !== undefined && (
                                <div className="p-4 bg-slate-700/30 rounded-lg">
                                    <p className="text-xs text-slate-400 mb-1">Минимальная цена</p>
                                    <p className="text-lg font-semibold text-white">${tool.minPrice}/мес</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Возможности */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Возможности</h3>
                        <div className="flex flex-wrap gap-2">
                            {tool.hasApi && (
                                <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-lg text-sm border border-green-700/30">
                                    API доступ
                                </span>
                            )}
                            {tool.hasMcp && (
                                <span className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-lg text-sm border border-purple-700/30">
                                    MCP поддержка
                                </span>
                            )}
                            {!tool.hasApi && !tool.hasMcp && (
                                <span className="text-slate-500 text-sm">Нет дополнительных возможностей</span>
                            )}
                        </div>
                    </div>

                    {/* Ссылки */}
                    <div className="pt-4 border-t border-slate-700 flex gap-3">
                        {tool.docsUrl && (
                            <a
                                href={tool.docsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                            >
                                Документация ↗
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToolDetailModal;