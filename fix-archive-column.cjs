/**
 * Script to add is_archived column to posts table
 * Run this once to fix the archive functionality
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iwtlekdynhfcqgwhocik.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixArchive() {
  console.log('🔧 Fixing archive functionality...\n');

  // Try to add the column using raw SQL via RPC
  // Note: This might not work if pgcrypto extension is not enabled
  // In that case, user needs to run SQL manually in Supabase Dashboard
  
  console.log('Attempting to add is_archived column...');
  
  // Method 1: Try using Supabase REST API with raw SQL
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      sql: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false; CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);`
    })
  });

  if (response.ok) {
    console.log('✅ Column added successfully!');
  } else {
    const error = await response.text();
    console.log('⚠️  Could not add column via API:', error);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log('```sql');
    console.log('ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;');
    console.log('CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);');
    console.log('```\n');
    console.log('👉 Open: https://supabase.com/dashboard/project/iwtlekdynhfcqgwhocik/sql\n');
    return;
  }

  // Verify the column was added
  console.log('\n🔍 Verifying column exists...');
  const { data: schema } = await supabase.rpc('execute_sql', {
    sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_archived';`
  });

  if (schema && schema.length > 0) {
    console.log('✅ Column verified!');
  } else {
    console.log('⚠️  Column verification failed');
  }

  console.log('\n✅ Fix complete!\n');
}

fixArchive().catch(console.error);
