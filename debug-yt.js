const { createClient } = require("@supabase/supabase-js");
const url = "https://iwtlekdynhfcqgwhocik.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
const YOUTUBE_API_KEY = "AIzaSyBZlh-83bo2jgKHIc3V48jK0SR3psCBPwI";

async function debug() {
  const res = await fetch(`${url}/rest/v1/channels?source=eq.YouTube&is_active=eq.true`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  });
  const channels = await res.json();
  console.log("Channels found:", channels.length);

  for (const channel of channels.slice(0, 3)) {
    let channelId = "";
    const curl = channel.url;
    if (curl.includes("/channel/")) {
      channelId = curl.split("/channel/")[1].split("/")[0];
    } else {
      const handle = curl.includes("@") ? curl.split("@")[1].split("/")[0] : curl.split("/").pop();
      if (handle) {
        const idUrl = `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&forHandle=${handle}&part=id,contentDetails`;
        const idRes = await fetch(idUrl);
        const idData = await idRes.json();
        if (idData.items?.[0]) channelId = idData.items[0].id;
      }
    }
    console.log(`Channel ${channel.name} resolved to ID: ${channelId}`);
    if (channelId) {
      const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&id=${channelId}&part=contentDetails`;
      const chRes = await fetch(channelInfoUrl);
      const chData = await chRes.json();
      const playlistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      console.log(`  Upload playlist: ${playlistId}`);
      if (playlistId) {
        const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${YOUTUBE_API_KEY}&playlistId=${playlistId}&part=snippet,contentDetails&maxResults=3`;
        const plRes = await fetch(plUrl);
        const plData = await plRes.json();
        console.log(`  Found ${plData.items?.length} videos`);
      }
    }
  }
}
debug().catch(console.error);
