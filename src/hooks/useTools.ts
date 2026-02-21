/**
 * Хук для работы с инструментами
 * Загрузка, фильтрация и поиск AI-инструментов
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClient } from '../lib/supabase/client';

export interface Tool {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    rating: number;
    dailyCredits?: number;
    monthlyCredits?: number;
    minPrice?: number;
    hasApi?: boolean;
    hasMcp?: boolean;
    pros: string[];
    docsUrl?: string;
    details: string[];
}

interface UseToolsOptions {
    category?: string;
    minRating?: number;
    hasFreeTier?: boolean;
    searchQuery?: string;
}

interface UseToolsReturn {
    tools: Tool[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    categories: string[];
}

/**
 * Хук для загрузки и управления инструментами
 */
export const useTools = (options: UseToolsOptions = {}): UseToolsReturn => {
    const { category, minRating, hasFreeTier, searchQuery } = options;

    const [tools, setTools] = useState<Tool[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTools = useCallback(async () => {
        const supabase = getClient();
        if (!supabase) {
            setError('Supabase client not available');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('tools')
                .select('*')
                .order('rating', { ascending: false });

            // Фильтр по категории
            if (category) {
                query = query.eq('category', category);
            }

            // Фильтр по минимальному рейтингу
            if (minRating !== undefined) {
                query = query.gte('rating', minRating);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            let formattedTools: Tool[] = (data || []).map(t => ({
                id: t.id,
                name: t.name,
                category: t.category,
                description: t.description,
                icon: t.icon || '🔧',
                rating: t.rating || 0,
                dailyCredits: t.daily_credits,
                monthlyCredits: t.monthly_credits,
                minPrice: t.min_price,
                hasApi: t.has_api,
                hasMcp: t.has_mcp,
                pros: t.pros || [],
                docsUrl: t.docs_url,
                details: []
            }));

            // Фильтр по бесплатному тарифу (клиентская фильтрация)
            if (hasFreeTier) {
                formattedTools = formattedTools.filter(t =>
                    t.dailyCredits !== undefined && t.dailyCredits > 0
                );
            }

            // Поиск по названию и описанию (клиентская фильтрация)
            if (searchQuery) {
                const queryLower = searchQuery.toLowerCase();
                formattedTools = formattedTools.filter(t =>
                    t.name.toLowerCase().includes(queryLower) ||
                    t.description.toLowerCase().includes(queryLower) ||
                    t.category.toLowerCase().includes(queryLower)
                );
            }

            setTools(formattedTools);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tools');
        } finally {
            setIsLoading(false);
        }
    }, [category, minRating, hasFreeTier, searchQuery]);

    const refetch = useCallback(async () => {
        await fetchTools();
    }, [fetchTools]);

    useEffect(() => {
        fetchTools();
    }, [fetchTools]);

    // Извлекаем уникальные категории
    const categories = useMemo(() => {
        const uniqueCategories = new Set(tools.map(t => t.category));
        return Array.from(uniqueCategories).sort();
    }, [tools]);

    return { tools, isLoading, error, refetch, categories };
};

/**
 * Хук для получения топ инструментов
 */
export const useTopTools = (limit: number = 5) => {
    const { tools, isLoading, error } = useTools({ minRating: 4 });

    const topTools = useMemo(() => {
        return tools.slice(0, limit);
    }, [tools, limit]);

    return { topTools, isLoading, error };
};

/**
 * Хук для получения инструментов по категории
 */
export const useToolsByCategory = (category: string) => {
    return useTools({ category });
};

/**
 * Хук для поиска инструментов
 */
export const useToolSearch = (searchQuery: string) => {
    return useTools({ searchQuery });
};
