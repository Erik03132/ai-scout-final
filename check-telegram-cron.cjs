/**
 * Diagnostic script to check Telegram cron status
 * Checks:
 * 1. Telegram channels in database
 * 2. Last fetch times
 * 3. Recent posts from Telegram
 */

const { createClient } = require('@supabase/supabase-js');

// Read from .env.local
const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkTelegramCron() {
  console.log('🔍 Checking Telegram cron status...\n');

  // 1. Check Telegram channels
  console.log('📺 Telegram Channels:');
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*')
    .eq('source', 'Telegram');

  if (channelsError) {
    console.error('Error fetching channels:', channelsError);
    return;
  }

  if (!channels || channels.length === 0) {
    console.log('  ⚠️  No Telegram channels found in database!\n');
  } else {
    console.log(`  Found ${channels.length} Telegram channel(s):\n`);
    channels.forEach((ch, i) => {
      console.log(`  ${i + 1}. ${ch.name}`);
      console.log(`     URL: ${ch.url}`);
      console.log(`     Active: ${ch.is_active ? '✅' : '❌'}`);
      console.log(`     Last fetched: ${ch.last_fetched_at ? new Date(ch.last_fetched_at).toLocaleString('ru-RU') : 'Never'}`);
      console.log('');
    });
  }

  // 2. Check recent Telegram posts
  console.log('📝 Recent Telegram Posts:');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .eq('source', 'Telegram')
    .order('created_at', { ascending: false })
    .limit(5);

  if (postsError) {
    console.error('Error fetching posts:', postsError);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log('  ⚠️  No Telegram posts found in database!\n');
  } else {
    console.log(`  Found ${posts.length} recent post(s):\n`);
    posts.forEach((post, i) => {
      console.log(`  ${i + 1}. ${post.title?.substring(0, 60) || 'No title'}`);
      console.log(`     Channel: ${post.channel}`);
      console.log(`     Date: ${new Date(post.date).toLocaleString('ru-RU')}`);
      console.log(`     Analyzed: ${post.is_analyzed ? '✅' : '❌'}`);
      console.log('');
    });
  }

  // 3. Check if fetch-telegram function exists
  console.log('🔧 Checking Supabase Edge Function:');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-telegram`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Edge Function is accessible');
      console.log('  Response:', JSON.stringify(result, null, 2));
    } else {
      console.log(`  ⚠️  Edge Function returned status ${response.status}`);
      const text = await response.text();
      console.log('  Response:', text);
    }
  } catch (error) {
    console.log('  ❌ Edge Function is not accessible:', error.message);
  }

  console.log('\n✅ Diagnostic complete!\n');
}

checkTelegramCron().catch(console.error);
