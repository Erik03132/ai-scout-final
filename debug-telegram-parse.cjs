/**
 * Debug script to test Telegram parsing
 */

const https = require('https');

const CHANNELS = [
  { name: 'neyroseti_dr', url: 'https://t.me/neyroseti_dr' },
  { name: 'geekneural', url: 'https://t.me/geekneural' },
  { name: 'dailyprompts', url: 'https://t.me/dailyprompts' },
];

async function fetchTelegramPreview(username) {
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

async function debugChannels() {
  console.log('🔍 Debugging Telegram channel parsing...\n');

  for (const channel of CHANNELS) {
    const username = channel.url.split('/').pop();
    console.log(`📺 Channel: ${channel.name} (@${username})`);
    
    try {
      const html = await fetchTelegramPreview(username);
      
      // Check if we got HTML
      if (!html || html.length < 100) {
        console.log('  ⚠️  Failed to fetch HTML\n');
        continue;
      }

      console.log(`  ✅ HTML fetched (${html.length} bytes)`);

      // Parse message blocks
      const messageBlocks = html.split('tgme_widget_message_wrap').reverse().slice(0, 5);
      console.log(`  Found ${messageBlocks.length} message blocks`);

      for (const block of messageBlocks) {
        const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
        if (!textMatch) {
          console.log('  - No text found in block');
          continue;
        }

        const rawText = textMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .trim();

        if (!rawText || rawText.length < 10) {
          console.log('  - Text too short');
          continue;
        }

        const linkMatch = block.match(/href="(https:\/\/t\.me\/[^"]+\/\d+)"/);
        const link = linkMatch ? linkMatch[1] : 'N/A';

        const dateMatch = block.match(/datetime="([^"]+)"/);
        const date = dateMatch ? dateMatch[1] : 'N/A';

        console.log(`  ✅ Post found:`);
        console.log(`     Title: ${rawText.split('\n')[0].substring(0, 50)}...`);
        console.log(`     Link: ${link}`);
        console.log(`     Date: ${date}`);
        console.log('');
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ Debug complete!\n');
}

debugChannels().catch(console.error);
