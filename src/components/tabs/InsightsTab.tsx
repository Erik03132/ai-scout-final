import React from 'react';
import { TrendingUp, ArrowRight, Brain } from 'lucide-react';
import { cn } from '../../utils/cn';

export const InsightsTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">AI Аналитика</h2>
                <p className="text-slate-400 text-sm mt-1">Интеллектуальный анализ трендов и инструментов</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                    { label: "Рост AI-инструментов", value: "+234%", change: "+12% за месяц", color: "from-cyan-500 to-blue-600" },
                    { label: "Анализировано контента", value: "1.2K", change: "за последние 7 дней", color: "from-emerald-500 to-teal-600" },
                    { label: "Найдено инструментов", value: "847", change: "32 новых за неделю", color: "from-amber-500 to-orange-600" },
                ].map((stat, index) => (
                    <div key={index} className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-slate-400 text-sm">{stat.label}</span>
                            <div className={cn("w-10 h-10 bg-gradient-to-br", stat.color, "rounded-xl flex items-center justify-center")}>
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                        <div className="text-xs text-slate-500">{stat.change}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-4">🔥 Тренды недели</h3>
                    <div className="space-y-3">
                        {[
                            { rank: 1, name: "AI Agents", growth: "+45%" },
                            { rank: 2, name: "Rust in Web", growth: "+38%" },
                            { rank: 3, name: "Edge Computing", growth: "+32%" },
                            { rank: 4, name: "WebGPU", growth: "+28%" },
                            { rank: 5, name: "Microfrontends", growth: "+24%" },
                        ].map(trend => (
                            <div key={trend.rank} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-700/30 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                                        trend.rank === 1 ? "bg-amber-500/20 text-amber-400" :
                                            trend.rank === 2 ? "bg-slate-400/20 text-slate-300" :
                                                trend.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                                                    "bg-slate-700 text-slate-500"
                                    )}>
                                        {trend.rank}
                                    </span>
                                    <span className="text-sm text-white">{trend.name}</span>
                                </div>
                                <span className="text-xs text-emerald-400 font-medium">{trend.growth}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                    <h3 className="font-semibold text-white mb-4">💡 AI Рекомендации</h3>
                    <div className="space-y-3">
                        {[
                            { title: "Обратите внимание на Bun", desc: "Замена Node.js с 5x ускорением" },
                            { title: "Попробуйте htmx", desc: "Без JS фреймворков для простых проектов" },
                            { title: "Изучите SQL", desc: "Основа для работы с любыми БД" },
                        ].map((rec, index) => (
                            <div key={index} className="p-3 bg-slate-700/30 rounded-xl border border-slate-600/30 cursor-pointer hover:border-cyan-500/30 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <ArrowRight className="w-4 h-4 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white text-sm">{rec.title}</h4>
                                        <p className="text-xs text-slate-400 mt-0.5">{rec.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
