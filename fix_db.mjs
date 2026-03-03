import { createClient } from '@supabase/supabase-js';
const url = "https://iwtlekdynhfcqgwhocik.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
const supabase = createClient(url, key);

async function run() {
  const badUrl = 'https://images.unsplash.com/photo-1620312554261-237466828551?auto=format&fit=crop&q=80&w=400&h=200';
  const goodUrl = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200';
  const { data, error } = await supabase.from('posts').update({ image: goodUrl }).eq('image', badUrl);
  console.log("Updated rows:", error || "success");
}
run();
