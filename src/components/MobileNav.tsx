"use client";

import { Archive, Layers, Search } from "lucide-react";

interface MobileNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
    const isActive = (tab: string) => activeTab === tab;

    return (
        <div className="md:hidden fixed bottom-6 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-2.5 flex items-center justify-around shadow-2xl shadow-black/50 safe-area-bottom">
            <button
                onClick={() => onTabChange('feed')}
                className={`flex flex-col items-center gap-1 ${isActive('feed') ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'} rounded-2xl p-3 transition-all`}
            >
                <Layers size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Лента</span>
            </button>

            <button
                onClick={() => onTabChange('archive')}
                className={`flex flex-col items-center gap-1 ${isActive('archive') ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'} rounded-2xl p-3 transition-all`}
            >
                <Archive size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Архив</span>
            </button>

            <button
                onClick={() => onTabChange('discover')}
                className={`flex flex-col items-center gap-1 ${isActive('discover') ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'} rounded-2xl p-3 transition-all`}
            >
                <Search size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Обзор</span>
            </button>

            <div className="flex flex-col items-center gap-1 text-slate-500 opacity-50 pointer-events-none">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-700 to-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-widest">Профиль</span>
            </div>
        </div>
    );
}
