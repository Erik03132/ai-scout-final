/**
 * Vercel Cron Job: Сбор YouTube видео
 * Запускается каждые 6 часов для соблюдения квоты YouTube API
 * 
 * Квота YouTube API: 10,000 units/day (бесплатно)
 * Один поиск = 100 units, одно видео = 1 unit
 * Сбор 4 раза в день = безопасно для квоты
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // Проверка секретного ключа для защиты от несанкционированных запросов
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Проверка что это Vercel Cron или авторизованный запрос
    const isVercelCron = req.headers['user-agent']?.includes('vercel');
    if (!isVercelCron && !providedSecret) {
        return res.status(401).json({ error: 'Missing authorization' });
    }

    try {
        // Вызываем Edge Function для сбора YouTube видео
        const response = await fetch(
            `${SUPABASE_URL}/functions/v1/fetch-youtube`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
                body: JSON.stringify({
                    triggered_by: 'vercel_cron',
                    timestamp: new Date().toISOString(),
                }),
            }
        );

        const result = await response.json();

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            result,
        });
    } catch (error) {
        console.error('Error in fetch-youtube cron:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
