/**
 * Скрипт для добавления поля is_archived в таблицу posts
 * Запуск: node apply-archive-migration.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  console.log('🚀 Применение миграции: добавление is_archived в posts\n');

  try {
    // Добавляем колонку is_archived
    console.log('📝 Добавление колонки is_archived...');
    
    const { error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.posts 
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
        
        CREATE INDEX IF NOT EXISTS idx_posts_is_archived 
        ON public.posts(is_archived);
        
        CREATE INDEX IF NOT EXISTS idx_posts_archived_created 
        ON public.posts(is_archived, created_at DESC);
      `
    });

    if (columnError) {
      console.log('⚠️  RPC exec_sql недоступен, пробуем через REST API...\n');
      
      // Альтернативный способ - через прямой SQL запрос к metadata
      console.log('Пожалуйста, примените миграцию вручную через Supabase Dashboard:\n');
      console.log('1. Откройте: https://supabase.com/dashboard/project/iwtlekdynhfcqgwhocik/sql');
      console.log('2. Вставьте следующий SQL:\n');
      console.log('---8<---8<---8<---8<---8<---8<---8<---8<---8<---8<---8<---');
      console.log(`
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_is_archived 
ON public.posts(is_archived);

CREATE INDEX IF NOT EXISTS idx_posts_archived_created 
ON public.posts(is_archived, created_at DESC);
      `);
      console.log('---8<---8<---8<---8<---8<---8<---8<---8<---8<---8<---8<---\n');
      return;
    }

    console.log('✅ Миграция успешно применена!\n');

    // Проверяем, что колонка добавлена
    console.log('🔍 Проверка наличия колонки...');
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, is_archived')
      .limit(1);

    if (error) {
      console.log('❌ Ошибка проверки:', error.message);
      return;
    }

    console.log('✅ Колонка is_archived доступна!\n');
    console.log('📊 Тестовые данные:');
    console.log(data);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

applyMigration();
