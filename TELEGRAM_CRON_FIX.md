# Telegram Cron Issue - Diagnosis and Fix

## Problem
Telegram channel updates stopped working on **March 9, 2026**. The cron job is configured to run daily at 07:00 UTC (`0 7 * * *`), but no updates were fetched for 3 days (March 10-12).

## Root Cause Analysis

### What Was Found:
1. **Last successful fetch**: March 9, 2026 at 16:30 MSK
2. **New posts available**: 23 posts from March 10-11 were not fetched
3. **Edge Function status**: Working correctly when called manually
4. **Parsing logic**: Correctly extracts posts from Telegram channels

### Why It Happened:
The Vercel cron jobs defined in `vercel.json` may not be active because:

1. **Vercel Deployment Required**: Cron jobs only run on Vercel's servers, not locally
2. **Missing CRON_SECRET**: The environment variable might not be set on Vercel
3. **Authorization Check**: The cron endpoint requires authorization that might be failing

## Immediate Fix Applied

### Manual Fetch Script Created:
- **File**: `fetch-telegram-now.cjs`
- **Usage**: `node fetch-telegram-now.cjs`
- **Result**: Successfully fetched 23 missing posts

## Permanent Solutions

### Option 1: Fix Vercel Cron Deployment (Recommended)

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables on Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `SUPABASE_URL=https://iwtlekdynhfcqgwhocik.supabase.co`
     - `SUPABASE_SERVICE_ROLE_KEY=your_key`
     - `CRON_SECRET=generate_a_secure_secret`

3. **Verify Cron Jobs**:
   - Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
   - Ensure all 4 cron jobs are listed and active:
     - `/api/cron/fetch-youtube` at 06:00 UTC
     - `/api/cron/fetch-telegram` at 07:00 UTC
     - `/api/cron/analyze-post` at 09:00 UTC
     - `/api/cron/cleanup` at 03:00 UTC

4. **Test Cron Endpoint**:
   ```bash
   curl -X POST https://your-project.vercel.app/api/cron/fetch-telegram \
     -H "Authorization: Bearer your_cron_secret"
   ```

### Option 2: Use Supabase Edge Function Scheduler

Instead of Vercel cron, use Supabase's built-in scheduler:

1. **Deploy pg_cron extension** in Supabase:
   ```sql
   -- Run in Supabase SQL Editor
   create extension if not exists pg_cron;
   ```

2. **Create scheduled job**:
   ```sql
   select cron.schedule(
     'fetch-telegram-daily',
     '0 7 * * *',
     $$
     select net.http_post(
       url:='https://iwtlekdynhfcqgwhocik.supabase.co/functions/v1/fetch-telegram',
       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
       body:='{"triggered_by": "pg_cron"}'::jsonb
     )
     $$
   );
   ```

### Option 3: GitHub Actions Scheduler

Create a GitHub Actions workflow:

```yaml
# .github/workflows/fetch-telegram.yml
name: Fetch Telegram Daily

on:
  schedule:
    - cron: '0 7 * * *'  # Daily at 07:00 UTC

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Telegram Fetch
        run: |
          curl -X POST https://iwtlekdynhfcqgwhocik.supabase.co/functions/v1/fetch-telegram \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

## Verification Steps

After applying any fix:

1. **Check last_fetched_at**:
   ```bash
   node check-telegram-cron.cjs
   ```

2. **Verify new posts in database**:
   ```sql
   SELECT * FROM posts 
   WHERE source = 'Telegram' 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Monitor for 24 hours** to ensure cron runs automatically

## Files Created for Debugging

| File | Purpose |
|------|---------|
| `check-telegram-cron.cjs` | Check cron status and last fetch time |
| `fetch-telegram-now.cjs` | Manually fetch Telegram posts |
| `trigger-telegram-fetch.cjs` | Test Edge Function directly |
| `debug-telegram-parse.cjs` | Debug Telegram HTML parsing |

## Current Status

✅ **23 new posts fetched** from 3 channels:
- neyroseti_dr: 9 posts
- geekneural: 4 posts
- dailyprompts: 10 posts

✅ **AI analysis triggered** for new posts

⚠️ **Cron job still needs to be fixed** for automatic daily updates

## Next Steps

1. **Immediate**: Run `node fetch-telegram-now.cjs` whenever manual update is needed
2. **Short-term**: Check Vercel Dashboard and verify cron jobs are active
3. **Long-term**: Consider Option 2 (Supabase scheduler) for more reliable execution

## Contact/Support

If cron jobs still don't run after deployment:
1. Check Vercel Function logs in Dashboard
2. Verify `CRON_SECRET` matches in `.env` and Vercel settings
3. Test endpoint manually with curl
4. Consider alternative scheduling options above
