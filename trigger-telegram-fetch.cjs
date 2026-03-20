/**
 * Manual trigger for Telegram fetch cron
 */

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

async function triggerFetch() {
  console.log('🚀 Manually triggering fetch-telegram...\n');

  try {
    // Option 1: Call Edge Function directly
    console.log('Option 1: Calling Edge Function directly...');
    const directResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-telegram`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        triggered_by: 'manual_test',
        timestamp: new Date().toISOString(),
      }),
    });

    console.log(`Status: ${directResponse.status} ${directResponse.statusText}`);
    const directResult = await directResponse.json();
    console.log('Response:', JSON.stringify(directResult, null, 2));
    console.log('');

    // Option 2: Call Vercel Cron endpoint (if deployed)
    console.log('Option 2: Calling Vercel cron endpoint (if deployed)...');
    console.log('Note: This requires your Vercel deployment URL');
    console.log('Try: curl -X POST https://your-project.vercel.app/api/cron/fetch-telegram\n');

  } catch (error) {
    console.error('Error:', error.message);
  }

  // Check posts after fetch
  console.log('📝 Checking for new posts...\n');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('source', 'Telegram')
    .order('created_at', { ascending: false })
    .limit(3);

  if (posts && posts.length > 0) {
    console.log('Recent Telegram posts:');
    posts.forEach((post, i) => {
      console.log(`  ${i + 1}. ${post.title?.substring(0, 60)}`);
      console.log(`     Created: ${new Date(post.created_at).toLocaleString('ru-RU')}`);
    });
  }
}

triggerFetch().catch(console.error);
