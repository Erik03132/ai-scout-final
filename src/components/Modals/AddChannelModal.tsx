/**
 * AddChannelModal Component
 * Модальное окно для добавления нового канала
 */

import React, { useState } from 'react';
import { isYouTubeUrl, extractChannelId } from '../../utils/youtubeApi';

interface AddChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (channel: {
        name: string;
        url: string;
        source: 'YouTube' | 'Telegram';
    }) => Promise<void>;
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
    isOpen,
    onClose,
    onAdd
}) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [source, setSource] = useState<'YouTube' | 'Telegram'>('YouTube');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Валидация
        if (!name.trim()) {
            setError('Введите название канала');
            return;
        }

        if (!url.trim()) {
            setError('Введите URL канала');
            return;
        }

        // Проверка URL для YouTube
        if (source === 'YouTube') {
            if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
                setError('Введите корректный YouTube URL');
                return;
            }
        }

        // Проверка URL для Telegram
        if (source === 'Telegram') {
            if (!url.includes('t.me/')) {
                setError('Введите корректный Telegram URL (t.me/...)');
                return;
            }
        }

        setIsLoading(true);
        try {
            await onAdd({ name: name.trim(), url: url.trim(), source });
            // Сброс формы
            setName('');
            setUrl('');
            setSource('YouTube');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка добавления канала');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setUrl('');
        setSource('YouTube');
        setError(null);
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
                    <h2 className="text-xl font-bold text-white">Добавить канал</h2>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Форма */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Источник */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Источник
                        </label>
                        <div className="flex gap-2">
                            {(['YouTube', 'Telegram'] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setSource(s)}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm transition-colors ${source === s
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {s === 'YouTube' ? '🎬 YouTube' : '📱 Telegram'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Название */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Название канала
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={source === 'YouTube' ? 'Например: AI Explained' : 'Например: @ai_news'}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            URL канала
                        </label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={
                                source === 'YouTube'
                                    ? 'https://www.youtube.com/@channel'
                                    : 'https://t.me/channel'
                            }
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        {source === 'YouTube' && url && isYouTubeUrl(url) && (
                            <p className="text-xs text-green-400 mt-1">
                                ✓ YouTube канал распознан
                            </p>
                        )}
                    </div>

                    {/* Ошибка */}
                    {error && (
                        <div className="p-3 bg-red-900/30 border border-red-700/30 rounded-lg">
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Добавление...' : 'Добавить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddChannelModal;