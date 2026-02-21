/**
 * SettingsModal Component
 * Модальное окно с настройками приложения
 */

import React, { useState } from 'react';

interface Settings {
    theme: 'dark' | 'light' | 'system';
    notifications: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
    language: 'ru' | 'en';
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: Settings;
    onSave: (settings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    settings: initialSettings,
    onSave
}) => {
    const [settings, setSettings] = useState<Settings>(initialSettings);
    const [hasChanges, setHasChanges] = useState(false);

    if (!isOpen) return null;

    const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onSave(settings);
        setHasChanges(false);
        onClose();
    };

    const handleClose = () => {
        setSettings(initialSettings);
        setHasChanges(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className="bg-slate-800 rounded-2xl max-w-md w-full border border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Заголовок */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">Настройки</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Настройки */}
                <div className="p-6 space-y-6">
                    {/* Тема */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Тема оформления
                        </label>
                        <div className="flex gap-2">
                            {[
                                { key: 'dark', label: '🌙 Тёмная' },
                                { key: 'light', label: '☀️ Светлая' },
                                { key: 'system', label: '💻 Системная' }
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => updateSetting('theme', option.key as Settings['theme'])}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${settings.theme === option.key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Язык */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Язык интерфейса
                        </label>
                        <div className="flex gap-2">
                            {[
                                { key: 'ru', label: '🇷🇺 Русский' },
                                { key: 'en', label: '🇬🇧 English' }
                            ].map((option) => (
                                <button
                                    key={option.key}
                                    onClick={() => updateSetting('language', option.key as Settings['language'])}
                                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${settings.language === option.key
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Уведомления */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-300">Уведомления</p>
                            <p className="text-xs text-slate-400">Получать уведомления о новых постах</p>
                        </div>
                        <button
                            onClick={() => updateSetting('notifications', !settings.notifications)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${settings.notifications ? 'bg-blue-600' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notifications ? 'left-7' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Автообновление */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-300">Автообновление</p>
                            <p className="text-xs text-slate-400">Автоматически обновлять ленту</p>
                        </div>
                        <button
                            onClick={() => updateSetting('autoRefresh', !settings.autoRefresh)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${settings.autoRefresh ? 'bg-blue-600' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.autoRefresh ? 'left-7' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Интервал обновления */}
                    {settings.autoRefresh && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Интервал обновления (минуты)
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={settings.refreshInterval}
                                onChange={(e) => updateSetting('refreshInterval', parseInt(e.target.value) || 5)}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}
                </div>

                {/* Кнопки */}
                <div className="flex gap-3 p-6 border-t border-slate-700">
                    <button
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;