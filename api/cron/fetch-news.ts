/**
 * Vercel Cron Job: Универсальный сбор новостей (YouTube + Telegram)
 * Объединяет вызовы для всех источников
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const maxDuration = 60; // Hobby plan limit

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Проверка секрета
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (CRON_SECRET && providedSecret !== CRON_SECRET && !req.headers['user-agent']?.includes('vercel')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const results: any = {
        youtube: null,
        telegram: null,
        analysis: null
    };

    try {
        // 1. YouTube Fetch
        try {
            const ytRes = await fetch(`${SUPABASE_URL}/functions/v1/fetch-youtube`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            });
            results.youtube = await ytRes.json();
        } catch (e) {
            results.youtube = { error: String(e) };
        }

        // 2. Telegram Fetch
        try {
            const tgRes = await fetch(`${SUPABASE_URL}/functions/v1/fetch-telegram`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            });
            results.telegram = await tgRes.json();
        } catch (e) {
            results.telegram = { error: String(e) };
        }

        // 3. Запуск анализа новых постов
        try {
            const analyzeRes = await fetch(`${SUPABASE_URL}/functions/v1/analyze-post`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
            });
            results.analysis = await analyzeRes.json();
        } catch (e) {
            results.analysis = { error: String(e) };
        }

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: String(error)
        });
    }
}
