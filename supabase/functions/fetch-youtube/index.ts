import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YouTubeVideo {
    id: { videoId: string };
    snippet: {
        title: string;
        description: string;
        thumbnails: { high: { url: string } };
        channelTitle: string;
        publishedAt: string;
    };
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

        if (!youtubeApiKey) {
            throw new Error("YOUTUBE_API_KEY not configured");
        }

        // Получаем активные YouTube каналы
        const { data: channels, error: channelsError } = await supabase
            .from("channels")
            .select("*")
            .eq("source", "YouTube")
            .eq("is_active", true);

        if (channelsError) throw channelsError;

        const newPosts = [];

        // Для каждого канала получаем последние видео
        for (const channel of channels || []) {
            try {
                // Извлекаем идентификатор канала
                let channelId = "";
                const url = channel.url;

                if (url.includes("/channel/")) {
                    channelId = url.split("/channel/")[1]?.split("/")[0] || url.split("/channel/")[1];
                } else {
                    // Если это handle (@username) или просто имя - получаем channelId через API
                    const handle = url.includes("@") ? url.split("@")[1]?.split("/")[0] : url.split("/").pop();
                    if (handle) {
                        const idUrl = `https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&forHandle=${handle}&part=id,contentDetails`;
                        const idRes = await fetch(idUrl);
                        const idData = await idRes.json();
                        if (idData.items?.[0]) {
                            channelId = idData.items[0].id;
                        }
                    }
                }

                if (!channelId) {
                    console.error(`Could not resolve channel ID for: ${channel.url}`);
                    continue;
                }

                // 1. Получаем uploads playlist ID (если его еще нет в БД, но пока берем через квоту - 1 unit)
                const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?key=${youtubeApiKey}&id=${channelId}&part=contentDetails`;
                const channelRes = await fetch(channelInfoUrl);
                const channelData = await channelRes.json();
                const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

                if (!uploadsPlaylistId) continue;

                // 2. Получаем последние видео из плейлиста (1 unit)
                // Это В 100 РАЗ ДЕШЕВЛЕ чем search (100 units)
                const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${youtubeApiKey}&playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=3`;
                const playlistRes = await fetch(playlistUrl);
                const playlistData = await playlistRes.json();

                for (const item of playlistData.items || []) {
                    const videoId = item.contentDetails.videoId;
                    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                    // Проверяем существование
                    const { data: existing } = await supabase
                        .from("posts")
                        .select("id")
                        .eq("url", videoUrl)
                        .maybeSingle();

                    if (existing) continue;

                    // Создаем пост
                    const post = {
                        title: item.snippet.title,
                        summary: item.snippet.description?.substring(0, 500) || "",
                        content: item.snippet.description || "",
                        source: "YouTube",
                        channel: item.snippet.channelTitle,
                        date: item.snippet.publishedAt,
                        tags: extractTags(item.snippet.title + " " + item.snippet.description),
                        mentions: [],
                        views: "0",
                        image: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "",
                        url: videoUrl,
                        is_analyzed: false,
                    };

                    const { error: insertError } = await supabase.from("posts").insert(post);
                    if (!insertError) newPosts.push(post);
                }

                // Обновляем время (1 unit квоты на весь цикл канала)
                await supabase.from("channels").update({ last_fetched_at: new Date().toISOString() }).eq("id", channel.id);

                // Небольшая задержка чтобы не спамить
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err) {
                console.error(`Error processing channel ${channel.name}:`, err);
            }
        }

        return new Response(
            JSON.stringify({ success: true, newPosts }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// Упрощенная функция извлечения channel ID
// В реальном приложении нужно использовать YouTube Channels API
function extractChannelId(url: string): string | null {
    // Если это URL канала
    if (url.includes("/channel/")) {
        return url.split("/channel/")[1]?.split("/")[0] || url.split("/channel/")[1];
    }
    // Если это URL пользователя
    if (url.includes("/@")) {
        return url.split("/@")[1]?.split("/")[0] || url.split("/@")[1];
    }
    // Для плейлиста или других URL возвращаем null
    return null;
}

// Простое извлечение тегов из текста
function extractTags(text: string): string[] {
    const keywords = [
        "AI", "React", "Next.js", "TypeScript", "JavaScript",
        "Python", "Machine Learning", "Frontend", "Backend",
        "API", "Database", "DevOps", "Cloud", "AWS"
    ];

    const foundTags = keywords.filter(tag =>
        text.toLowerCase().includes(tag.toLowerCase())
    );

    return foundTags.length > 0 ? foundTags : ["Tech"];
}
