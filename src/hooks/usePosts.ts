/**
 * Хук для работы с постами
 * Загрузка, фильтрация и управление постами из Supabase
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getClient } from '../lib/supabase/client';

export interface Post {
    id: number;
    title: string;
    summary: string;
    source: 'YouTube' | 'Telegram';
    channel: string;
    date: string;
    tags: string[];
    mentions: string[];
    views: string;
    image: string;
    url: string;
    detailedUsage?: string;
    usageTips?: string[];
    content?: string;
    is_analyzed?: boolean;
}

interface UsePostsOptions {
    limit?: number;
    source?: 'YouTube' | 'Telegram' | 'all';
    tag?: string;
}

interface UsePostsReturn {
    posts: Post[];
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    hasMore: boolean;
    loadMore: () => Promise<void>;
}

/**
 * Хук для загрузки и управления постами
 */
export const usePosts = (options: UsePostsOptions = {}): UsePostsReturn => {
    const { limit = 20, source = 'all', tag } = options;

    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchPosts = useCallback(async (resetOffset = false) => {
        const supabase = getClient();
        if (!supabase) {
            setError('Supabase client not available');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const currentOffset = resetOffset ? 0 : offset;

            // Строим запрос
            let query = supabase
                .from('posts')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(currentOffset, currentOffset + limit - 1);

            // Фильтр по источнику
            if (source !== 'all') {
                query = query.eq('source', source);
            }

            // Фильтр по тегу
            if (tag) {
                query = query.contains('tags', [tag]);
            }

            const { data, count, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            const formattedPosts: Post[] = (data || []).map(p => ({
                id: typeof p.id === 'string' ? parseInt(p.id.slice(0, 8), 16) : p.id,
                title: p.title,
                summary: p.summary || '',
                source: p.source,
                channel: p.channel,
                date: p.date ? new Date(p.date).toLocaleDateString() : '',
                tags: p.tags || [],
                mentions: p.mentions || [],
                views: p.views || '0',
                image: p.image || '',
                url: p.url,
                detailedUsage: p.detailed_usage || '',
                usageTips: p.usage_tips || [],
                is_analyzed: p.is_analyzed
            }));

            if (resetOffset) {
                setPosts(formattedPosts);
                setOffset(limit);
            } else {
                setPosts(prev => [...prev, ...formattedPosts]);
                setOffset(prev => prev + limit);
            }

            setTotalCount(count || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch posts');
        } finally {
            setIsLoading(false);
        }
    }, [limit, source, tag, offset]);

    const refetch = useCallback(async () => {
        setOffset(0);
        await fetchPosts(true);
    }, [fetchPosts]);

    const loadMore = useCallback(async () => {
        if (!isLoading && posts.length < totalCount) {
            await fetchPosts(false);
        }
    }, [fetchPosts, isLoading, posts.length, totalCount]);

    useEffect(() => {
        fetchPosts(true);
    }, [source, tag]); // Зависимости для перезагрузки при изменении фильтров

    const hasMore = useMemo(() => posts.length < totalCount, [posts.length, totalCount]);

    return { posts, isLoading, error, refetch, hasMore, loadMore };
};

/**
 * Хук для поиска по постам
 */
export const usePostSearch = (searchQuery: string) => {
    const [results, setResults] = useState<Post[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const searchPosts = async () => {
            if (!searchQuery.trim()) {
                setResults([]);
                return;
            }

            const supabase = getClient();
            if (!supabase) return;

            setIsSearching(true);

            try {
                const { data } = await supabase
                    .from('posts')
                    .select('*')
                    .or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`)
                    .limit(10);

                if (data) {
                    setResults(data.map(p => ({
                        id: typeof p.id === 'string' ? parseInt(p.id.slice(0, 8), 16) : p.id,
                        title: p.title,
                        summary: p.summary || '',
                        source: p.source,
                        channel: p.channel,
                        date: p.date ? new Date(p.date).toLocaleDateString() : '',
                        tags: p.tags || [],
                        mentions: p.mentions || [],
                        views: p.views || '0',
                        image: p.image || '',
                        url: p.url
                    })));
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(searchPosts, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    return { results, isSearching };
};
