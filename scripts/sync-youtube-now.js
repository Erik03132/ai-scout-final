const supabaseUrl = "https://iwtlekdynhfcqgwhocik.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dGxla2R5bmhmY3Fnd2hvY2lrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTYzODc5NSwiZXhwIjoyMDg3MjE0Nzk1fQ.TyVFqfjc4Ir22cKmZ_sM3l0SMtkSCIcwKJi2G8pxGIY";
const youtubeApiKey = "AIzaSyBZlh-83bo2jgKHIc3V48jK0SR3psCBPwI";

async function supabaseFetch(table, method, body, query = "") {
    const url = `${supabaseUrl}/rest/v1/${table}${query}`;
    const opts = {
        method,
        headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": method === "POST" ? "return=representation" : ""
        }
    };
    if (body) Object.assign(opts, { body: JSON.stringify(body) });
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error(`Supabase Error: ${await r.text()}`);
    return r.json();
}

function extractTags(text) {
    const keywords = ["AI", "React", "Next.js", "TypeScript", "JavaScript", "Python", "Machine Learning", "Frontend", "Backend", "API", "Database", "DevOps", "Cloud", "AWS"];
    const foundTags = keywords.filter(tag => text.toLowerCase().includes(tag.toLowerCase()));
    return foundTags.length > 0 ? foundTags : ["Tech"];
}

async function run() {
    console.log("Fetching channels...");
    const channels = await supabaseFetch("channels", "GET", null, "?source=eq.YouTube&is_active=eq.true");
    console.log(`Found ${channels.length} active YouTube channels.`);

    let inserted = 0;
    for (const channel of channels) {
        try {
            let channelId = "";
            let url = channel.url;
            if (url.includes("/channel/")) {
                channelId = url.split("/channel/")[1].split("/")[0] || url.split("/channel/")[1];
            } else {
                const handle = url.includes("@") ? url.split("@")[1].split("/")[0] : url.split("/").pop();
                if (handle) {
                    const idRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&forHandle=${handle}&part=id,contentDetails`);
                    const idData = await idRes.json();
                    if (idData.items?.[0]) channelId = idData.items[0].id;
                }
            }

            if (!channelId) {
                console.error(`Could not resolve channel ID for: ${channel.url}`);
                continue;
            }

            const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&id=${channelId}&part=contentDetails`);
            const channelData = await channelRes.json();
            const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

            if (!uploadsPlaylistId) continue;

            const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?key=${youtubeApiKey}&playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=3`);
            const playlistData = await playlistRes.json();

            for (const item of playlistData.items || []) {
                const videoId = item.contentDetails.videoId;
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                const existing = await supabaseFetch("posts", "GET", null, `?url=eq.${encodeURIComponent(videoUrl)}&limit=1`);
                if (existing && existing.length > 0) continue;

                const post = {
                    title: item.snippet.title,
                    summary: item.snippet.description?.substring(0, 500) || "",
                    content: item.snippet.description || "",
                    source: "YouTube",
                    channel: item.snippet.channelTitle || channel.name,
                    date: item.snippet.publishedAt,
                    tags: extractTags(item.snippet.title + " " + item.snippet.description),
                    mentions: [],
                    views: "0",
                    image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "",
                    url: videoUrl,
                    is_analyzed: false,
                };

                await supabaseFetch("posts", "POST", post);
                console.log(`Inserted: ${post.title} for channel ${post.channel}`);
                inserted++;
            }
            await supabaseFetch("channels", "PATCH", { last_fetched_at: new Date().toISOString() }, `?id=eq.${channel.id}`);
            await new Promise(r => setTimeout(r, 200));
        } catch (e) {
            console.error(`Error on channel ${channel.name}:`, e.message);
        }
    }
    console.log(`Done! Inserted ${inserted} new YouTube videos.`);
}
run();
