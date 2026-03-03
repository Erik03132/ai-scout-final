import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Получаем активные Telegram каналы
        const { data: channels, error: channelsError } = await supabase
            .from("channels")
            .select("*")
            .eq("source", "Telegram")
            .eq("is_active", true);

        if (channelsError) throw channelsError;

        const newPosts = [];

        for (const channel of channels || []) {
            try {
                // Извлекаем username канала
                const username = channel.url.split('/').pop()?.replace('@', '').split('?')[0];
                if (!username) continue;

                // Используем t.me/s/username для парсинга (как в api/telegram-latest.ts)
                const previewUrl = `https://t.me/s/${username}`;
                const response = await fetch(previewUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!response.ok) continue;
                const html = await response.text();

                // Парсинг последних сообщений
                const messageBlocks = html.split('tgme_widget_message_wrap').reverse().slice(0, 5);

                for (const block of messageBlocks) {
                    const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
                    if (!textMatch) continue;

                    const rawText = textMatch[1]
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .trim();

                    if (!rawText || rawText.length < 10) continue;

                    const linkMatch = block.match(/href="(https:\/\/t\.me\/[^"]+\/\d+)"/);
                    const videoLinkMatch = block.match(/href="(https:\/\/youtube\.com\/watch\?v=[^"]+)"/);
                    const link = linkMatch ? linkMatch[1] : (videoLinkMatch ? videoLinkMatch[1] : channel.url);

                    const dateMatch = block.match(/datetime="([^"]+)"/);
                    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

                    // Проверяем существование
                    const { data: existing } = await supabase
                        .from("posts")
                        .select("id")
                        .eq("url", link)
                        .maybeSingle();

                    if (existing) continue;

                    // Создаем пост
                    const post = {
                        title: rawText.split('\n')[0].substring(0, 100) || "Новый пост",
                        summary: rawText.substring(0, 300),
                        content: rawText,
                        source: "Telegram",
                        channel: channel.name || username,
                        date: date,
                        tags: ["Telegram"],
                        mentions: [],
                        views: "0",
                        image: "https://images.unsplash.com/photo-1620312554261-237466828551?auto=format&fit=crop&q=80&w=400&h=200", // Заглушка для TG
                        url: link,
                        is_analyzed: false,
                    };

                    const { error: insertError } = await supabase.from("posts").insert(post);
                    if (!insertError) newPosts.push(post);
                }

                await supabase.from("channels").update({ last_fetched_at: new Date().toISOString() }).eq("id", channel.id);

            } catch (err) {
                console.error(`Error processing Telegram channel ${channel.url}:`, err);
            }
        }

        return new Response(
            JSON.stringify({ success: true, newPostsCount: newPosts.length }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
