/**
 * Принудительный запуск сбора Telegram постов
 * Вызывает Edge Function в Supabase (работает через proxy Supabase)
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

async function forceFetchTelegram() {
  console.log('🚀 Принудительный сбор Telegram постов...\n');
  console.log('📡 Вызов Edge Function в Supabase...\n');

  try {
    const startTime = Date.now();
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-telegram`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          triggered_by: 'manual_force_fetch',
          timestamp: new Date().toISOString(),
        }),
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const result = await response.json();

    console.log('⏱ Время выполнения:', elapsed, 'сек\n');

    if (response.ok) {
      console.log('✅ УСПЕШНО!\n');
      console.log('📊 Результат:');
      console.log(`   • Найдено новых постов: ${result.newPostsCount || 0}`);
      
      if (result.debug && result.debug.length > 0) {
        console.log('\n⚠️  Ошибки по каналам:');
        result.debug.forEach((dbg, i) => {
          console.log(`   ${i + 1}. ${dbg.channel}: ${dbg.error}`);
        });
      }
      
      if ((result.newPostsCount || 0) > 0) {
        console.log('\n🧠 AI анализ запущен автоматически!\n');
      }
    } else {
      console.log('❌ ОШИБКА!\n');
      console.log('Status:', response.status);
      console.log('Error:', result.error || 'Unknown error');
    }

  } catch (error) {
    console.log('❌ ОШИБКА ВЫЗОВА!\n');
    console.log('Error:', error.message);
  }

  // Проверка последних постов
  console.log('\n📋 Проверка последних постов в базе...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const { data: posts } = await supabase
    .from('posts')
    .select('channel, title, date, url')
    .eq('source', 'Telegram')
    .order('created_at', { ascending: false })
    .limit(5);

  if (posts && posts.length > 0) {
    console.log('✅ Последние 5 постов из Telegram:\n');
    posts.forEach((p, i) => {
      console.log(`${i + 1}. ${p.channel}`);
      console.log(`   📝 ${p.title?.substring(0, 70) || 'Без названия'}...`);
      console.log(`   📅 ${new Date(p.date).toLocaleString('ru-RU')}`);
      console.log(`   🔗 ${p.url}\n`);
    });
  } else {
    console.log('⚠️  Посты не найдены\n');
  }
}

forceFetchTelegram().catch(console.error);
