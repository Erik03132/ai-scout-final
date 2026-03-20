/**
 * Проверка доступа Telegram бота к каналам
 */

const TELEGRAM_BOT_TOKEN = '7765657782:AAHupHSGfyZK1cQz9XlK53BNQ_28qAz9B1k';
const CHANNELS = ['dailyprompts', 'geekneural', 'neyroseti_dr'];

async function checkChannelAccess() {
  console.log('🔍 Проверка доступа бота к каналам\n');

  for (const channel of CHANNELS) {
    console.log(`📺 Канал: @${channel}`);
    
    try {
      // Пытаемся получить информацию о канале через бота
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat?chat_id=@${channel}`
      );
      
      const data = await response.json();
      
      if (data.ok) {
        console.log(`  ✅ Бот имеет доступ!`);
        console.log(`     Название: ${data.result.title || data.result.username}`);
        console.log(`     Тип: ${data.result.type}`);
        console.log(`     ID: ${data.result.id}`);
        
        // Пытаемся получить последние сообщения
        const updatesResponse = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?chat_id=${data.result.id}&limit=5`
        );
        
        const updatesData = await updatesResponse.json();
        
        if (updatesData.ok && updatesData.result.length > 0) {
          console.log(`  📝 Последние сообщения:`);
          updatesData.result.forEach((upd, i) => {
            const msg = upd.channel_post || upd.message;
            if (msg) {
              console.log(`    ${i+1}. ${msg.text?.substring(0, 50) || 'Без текста'}...`);
              console.log(`       Дата: ${new Date(msg.date * 1000).toLocaleString('ru-RU')}`);
            }
          });
        } else {
          console.log(`  ⚠️  Сообщений не найдено (бот не админ?)`);
        }
      } else {
        console.log(`  ❌ Ошибка: ${data.description}`);
      }
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error.message}`);
    }
    
    console.log('');
  }
}

checkChannelAccess().catch(console.error);
