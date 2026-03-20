/**
 * Test archive functionality
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testArchive() {
  console.log('🔍 Testing archive functionality...\n');

  // 1. Check recent posts
  console.log('📝 Recent posts:');
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (postsError) {
    console.log('  Error:', postsError.message);
    return;
  }

  console.log(`  Found ${posts.length} posts:\n`);
  posts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.title?.substring(0, 50)}...`);
    console.log(`     ID: ${p.id}`);
    console.log(`     is_archived: ${p.is_archived || false}`);
    console.log(`     created_at: ${new Date(p.created_at).toLocaleString('ru-RU')}`);
    console.log('');
  });

  // 2. Check archived posts count
  console.log('📊 Archived posts statistics:');
  const { count: archivedCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('is_archived', true);

  const { count: totalCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  console.log(`  Total posts: ${totalCount || 0}`);
  console.log(`  Archived posts: ${archivedCount || 0}`);
  console.log(`  Active posts: ${(totalCount || 0) - (archivedCount || 0)}`);

  // 3. Check if posts.is_archived column exists
  console.log('\n📝 Checking posts.is_archived column:');
  const { data: schema } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'is_archived';
    `
  });

  if (schema && schema.length > 0) {
    console.log('  ✅ is_archived column exists');
  } else {
    console.log('  ❌ is_archived column does NOT exist - THIS IS THE PROBLEM!');
    console.log('\n  💡 Solution: Run this SQL in Supabase SQL Editor:');
    console.log('  ```sql');
    console.log('  ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;');
    console.log('  ```');
  }

  console.log('\n✅ Test complete!\n');
}

testArchive().catch(console.error);
