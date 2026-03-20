/**
 * Check favorites table structure and data
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkFavorites() {
  console.log('🔍 Checking favorites table...\n');

  // 1. Check table structure
  console.log('📊 Table structure:');
  const { data: schema, error: schemaError } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'favorites' 
      ORDER BY ordinal_position;
    `
  });
  
  if (schemaError) {
    console.log('  Could not get schema:', schemaError.message);
  } else {
    console.log('  Schema:', schema);
  }

  // 2. Check existing favorites
  console.log('\n⭐ Existing favorites:');
  const { data: favorites, error: favError } = await supabase
    .from('favorites')
    .select('*')
    .limit(20);

  if (favError) {
    console.log('  Error:', favError.message);
  } else if (!favorites || favorites.length === 0) {
    console.log('  No favorites found');
  } else {
    console.log(`  Found ${favorites.length} favorite(s):`);
    favorites.forEach(f => {
      console.log(`    - ${f.item_id} (${f.item_type}) by ${f.user_id}`);
    });
  }

  // 3. Check posts table for is_favorite column
  console.log('\n📝 Checking posts.is_favorite column:');
  const { data: postsSchema } = await supabase.rpc('execute_sql', {
    sql: `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND column_name = 'is_favorite';
    `
  });
  
  if (postsSchema && postsSchema.length > 0) {
    console.log('  ✅ is_favorite column exists');
  } else {
    console.log('  ❌ is_favorite column does NOT exist');
  }

  // 4. Test insert
  console.log('\n🧪 Testing insert:');
  const testId = `post-${Date.now()}`;
  const { data: insertResult, error: insertError } = await supabase
    .from('favorites')
    .insert({
      user_id: 'public_user',
      item_id: testId,
      item_type: 'post'
    })
    .select()
    .single();

  if (insertError) {
    console.log('  ❌ Insert failed:', insertError.message);
  } else {
    console.log('  ✅ Insert successful:', insertResult);
    
    // Clean up test
    await supabase.from('favorites').delete().eq('item_id', testId);
    console.log('  🧹 Test record cleaned up');
  }

  console.log('\n✅ Check complete!\n');
}

checkFavorites().catch(console.error);
