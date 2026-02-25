/**
 * Vercel Cron Job: Очистка старых данных
 * Запускается ежедневно в 03:00 UTC
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Увеличиваем лимит времени выполнения до 60 секунд (Hobby plan)
export const maxDuration = 60;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const authHeader = req.headers.authorization;
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (CRON_SECRET && providedSecret !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Очистка старых telegram_messages через Supabase REST API
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/telegram_messages?created_at=lt.${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`,
            {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_SERVICE_KEY!,
                    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
                    'Prefer': 'return=count',
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Cleanup completed',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: String(error) });
    }
}
