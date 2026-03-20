/**
 * Manual fetch for missing Telegram posts
 * Fetches posts from all active Telegram channels and inserts them into database
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function fetchTelegramPreview(username) {
  return new Promise((resolve, reject) => {
    const url = `https://t.me/s/${username}`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function fetchMissingPosts() {
  console.log('🚀 Fetching missing Telegram posts...\n');

  // Get active Telegram channels
  const { data: channels, error: channelsError } = await supabase
    .from('channels')
    .select('*')
    .eq('source', 'Telegram')
    .eq('is_active', true);

  if (channelsError) {
    console.error('Error fetching channels:', channelsError);
    return;
  }

  console.log(`Found ${channels.length} active Telegram channels\n`);

  let totalNewPosts = 0;

  for (const channel of channels) {
    const username = channel.url.split('/').pop()?.replace('@', '').split('?')[0];
    if (!username) {
      console.log(`⚠️  Skipping ${channel.name}: invalid username`);
      continue;
    }

    console.log(`📺 Processing ${channel.name} (@${username})...`);

    try {
      const html = await fetchTelegramPreview(username);
      const messageBlocks = html.split('tgme_widget_message_wrap').reverse().slice(0, 10);

      let channelNewPosts = 0;

      for (const block of messageBlocks) {
        const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
        if (!textMatch) continue;

        const rawText = textMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .trim();

        if (!rawText || rawText.length < 10) continue;

        const linkMatch = block.match(/href="(https:\/\/t\.me\/[^"]+\/\d+)"/);
        const videoLinkMatch = block.match(/href="(https:\/\/youtube\.com\/watch\?v=[^"]+)"/);
        const link = linkMatch ? linkMatch[1] : (videoLinkMatch ? videoLinkMatch[1] : channel.url);

        const dateMatch = block.match(/datetime="([^"]+)"/);
        const date = dateMatch ? dateMatch[1] : new Date().toISOString();

        // Check if post already exists
        const { data: existing } = await supabase
          .from('posts')
          .select('id')
          .eq('url', link)
          .maybeSingle();

        if (existing) {
          console.log(`  ⏭️  Skipping existing: ${rawText.split('\n')[0].substring(0, 40)}...`);
          continue;
        }

        // Create new post
        const post = {
          title: rawText.split('\n')[0].substring(0, 100) || 'Новый пост',
          summary: rawText.substring(0, 300),
          content: rawText,
          source: 'Telegram',
          channel: channel.name || username,
          date: date,
          tags: ['Telegram'],
          mentions: [],
          views: '0',
          image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200',
          url: link,
          is_analyzed: false,
        };

        const { error: insertError } = await supabase.from('posts').insert(post);
        if (insertError) {
          console.log(`  ❌ Insert error: ${insertError.message}`);
        } else {
          console.log(`  ✅ Added: ${post.title.substring(0, 50)}...`);
          channelNewPosts++;
          totalNewPosts++;
        }
      }

      // Update last_fetched_at
      await supabase
        .from('channels')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', channel.id);

      console.log(`  📊 New posts from ${channel.name}: ${channelNewPosts}\n`);

    } catch (error) {
      console.error(`  ❌ Error processing ${channel.name}:`, error.message);
    }
  }

  console.log(`\n✅ Fetch complete! Total new posts: ${totalNewPosts}`);

  // Trigger analysis if new posts were found
  if (totalNewPosts > 0) {
    console.log('\n🧠 Triggering AI analysis...');
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/analyze-post`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
        },
      });
      console.log('✅ Analysis triggered successfully');
    } catch (error) {
      console.error('⚠️  Could not trigger analysis:', error.message);
    }
  }
}

fetchMissingPosts().catch(console.error);
