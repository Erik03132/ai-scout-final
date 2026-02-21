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
            // Получаем channel ID из URL (упрощенно)
            const channelId = extractChannelId(channel.url);

            if (!channelId) continue;

            const youtubeUrl = `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`;

            const response = await fetch(youtubeUrl);
            const data = await response.json() as { items: YouTubeVideo[] };

            for (const video of data.items || []) {
                if (!video.id?.videoId) continue;

                const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;

                // Проверяем, есть ли уже этот пост
                const { data: existing } = await supabase
                    .from("posts")
                    .select("id")
                    .eq("url", videoUrl)
                    .single();

                if (existing) continue;

                // Создаем новый пост
                const post = {
                    title: video.snippet.title,
                    summary: video.snippet.description?.substring(0, 200) || "",
                    source: "YouTube",
                    channel: video.snippet.channelTitle,
                    date: video.snippet.publishedAt,
                    tags: extractTags(video.snippet.title + " " + video.snippet.description),
                    mentions: [], // Будет заполнено AI
                    views: "0",
                    image: video.snippet.thumbnails?.high?.url || "",
                    url: videoUrl,
                    is_analyzed: false,
                };

                const { error: insertError } = await supabase
                    .from("posts")
                    .insert(post);

                if (!insertError) {
                    newPosts.push(post);
                }
            }

            // Обновляем время последнего fetch
            await supabase
                .from("channels")
                .update({ last_fetched_at: new Date().toISOString() })
                .eq("id", channel.id);
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
