import { createClient } from '@supabase/supabase-js';
const url = "https://iwtlekdynhfcqgwhocik.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
const supabase = createClient(url, key);

async function run() {
  const { data: channels } = await supabase.from('channels').select('*').eq('source', 'YouTube');
  console.log("YouTube Channels:", channels);
  const { data: posts } = await supabase.from('posts').select('url, title').eq('source', 'YouTube');
  console.log("YouTube Posts:", posts.length);
}
run();
