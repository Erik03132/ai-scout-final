/**
 * Тест парсинга Telegram канала через прокси
 */

const https = require('https');
const HttpsProxyAgent = require('https-proxy-agent');

const CHANNELS = ['dailyprompts', 'geekneural', 'neyroseti_dr'];

async function testWithProxy() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  
  console.log('🔍 Тест парсинга Telegram каналов\n');
  console.log(`Proxy: ${proxyUrl || 'Не используется'}\n`);

  for (const username of CHANNELS) {
    console.log(`📺 Канал: @${username}`);
    
    try {
      const options = {
        hostname: 't.me',
        path: `/s/${username}`,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        timeout: 15000,
      };

      if (proxyUrl) {
        options.agent = new HttpsProxyAgent(proxyUrl);
      }

      const html = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          console.log(`  Status: ${res.statusCode}`);
          
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
        
        req.end();
      });

      // Проверяем наличие сообщений
      const messageCount = (html.match(/tgme_widget_message/g) || []).length;
      console.log(`  ✅ HTML получен, размер: ${html.length} байт`);
      console.log(`  📝 Найдено сообщений: ${messageCount}`);

      // Проверяем последние сообщения
      const messageBlocks = html.split('tgme_widget_message_wrap').reverse().slice(0, 3);
      console.log(`  📋 Последние 3 сообщения:`);
      
      for (const block of messageBlocks) {
        const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
        const linkMatch = block.match(/href="(https:\/\/t\.me\/[^"]+\/\d+)"/);
        const dateMatch = block.match(/datetime="([^"]+)"/);
        
        if (textMatch) {
          const rawText = textMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
          
          const link = linkMatch ? linkMatch[1] : 'N/A';
          const date = dateMatch ? dateMatch[1] : 'N/A';
          
          console.log(`    • ${link}`);
          console.log(`      Дата: ${date}`);
          console.log(`      Текст: ${rawText.substring(0, 80)}...`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error.message}`);
    }
    
    console.log('');
  }
}

testWithProxy().catch(console.error);
