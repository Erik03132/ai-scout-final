import { useState } from 'react';

interface AIResponse<T> {
    loading: boolean;
    error: string | null;
    data: T | null;
    ask: (prompt: string) => Promise<T | null>;
}

/**
 * useAI Hook
 * Simplifies interactions with AI API routes.
 * 
 * Usage:
 * const { ask, loading, data, error } = useAI<string>('/api/ai-summary');
 * await ask("How to build a rocket?");
 */
export function useAI<T = any>(apiEndpoint: string): AIResponse<T> {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<T | null>(null);

    const ask = async (prompt: string) => {
        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: prompt }),
            });

            if (!response.ok) {
                throw new Error(`AI request failed: ${response.statusText}`);
            }

            const result = await response.json();
            // Assumes API returns { summary: ... } or similar. Adjust as needed.
            // For a generic hook, we might return the whole JSON or specific field.
            // Here we assume the API returns the data directly or wrapped.
            const resultData = result.summary || result.data || result;

            setData(resultData);
            return resultData;
        } catch (err: any) {
            setError(err.message || 'Unknown error occurred');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, data, ask };
}
