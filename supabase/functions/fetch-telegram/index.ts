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

        console.log("🚀 Starting Telegram fetch...");

        // Получаем активные Telegram каналы
        const { data: channels, error: channelsError } = await supabase
            .from("channels")
            .select("*")
            .eq("source", "Telegram")
            .eq("is_active", true);

        if (channelsError) {
            console.error("❌ Channels error:", channelsError);
            throw channelsError;
        }

        console.log(`📺 Found ${channels?.length || 0} Telegram channels`);

        if (!channels || channels.length === 0) {
            return new Response(
                JSON.stringify({ success: true, count: 0, message: "No Telegram channels configured" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const newPosts = [];
        const debugInfo = [];

        for (const channel of channels) {
            try {
                // Извлекаем username канала
                const username = channel.url.split('/').pop()?.replace('@', '').split('?')[0];
                if (!username) {
                    console.log(`⚠️  Skipping ${channel.name}: invalid username`);
                    debugInfo.push({ channel: channel.name, error: "Invalid username" });
                    continue;
                }

                console.log(`📡 Fetching @${username}...`);

                // Используем t.me/s/username для парсинга
                const previewUrl = `https://t.me/s/${username}`;

                // Обновлённый User-Agent (Chrome 120)
                const response = await fetch(previewUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    },
                    timeout: 15000,
                });

                console.log(`📊 Response status for @${username}: ${response.status}`);

                if (!response.ok) {
                    console.log(`⚠️  HTTP ${response.status} for @${username}`);
                    debugInfo.push({ channel: channel.name, username, error: `HTTP ${response.status}` });
                    continue;
                }

                const html = await response.text();
                console.log(`📄 HTML size for @${username}: ${html.length} bytes`);

                // Проверяем, есть ли сообщения в HTML
                const messageCount = (html.match(/tgme_widget_message/g) || []).length;
                console.log(`📝 Found ${messageCount} message blocks in @${username}`);

                if (messageCount === 0) {
                    // Проверяем, не вернул ли Telegram капчу или ошибку
                    if (html.includes('captcha') || html.includes('bot protection')) {
                        console.log(`⚠️  Bot protection/captcha for @${username}`);
                        debugInfo.push({ channel: channel.name, username, error: "Bot protection" });
                    } else {
                        console.log(`⚠️  No messages found in @${username}`);
                        debugInfo.push({ channel: channel.name, username, error: "No messages in HTML" });
                    }
                    continue;
                }

                // Парсинг последних сообщений (берём больше блоков для надёжности)
                const messageBlocks = html.split('tgme_widget_message_wrap').reverse().slice(0, 15);
                console.log(`🔍 Processing ${messageBlocks.length} blocks from @${username}`);

                let channelNewPosts = 0;

                for (const block of messageBlocks) {
                    // Улучшенный regex для текста сообщения
                    const textMatch = block.match(/<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
                    if (!textMatch) continue;

                    const rawText = textMatch[1]
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .trim();

                    if (!rawText || rawText.length < 10) continue;

                    // Улучшенное извлечение ссылки
                    const linkMatch = block.match(/href="(https:\/\/t\.me\/[^"]+\/\d+)"/);
                    const videoLinkMatch = block.match(/href="(https:\/\/youtube\.com\/watch\?v=[^"]+)"/);
                    const link = linkMatch ? linkMatch[1] : (videoLinkMatch ? videoLinkMatch[1] : null);

                    if (!link) {
                        console.log(`⚠️  No link found, skipping`);
                        continue;
                    }

                    const dateMatch = block.match(/datetime="([^"]+)"/);
                    const date = dateMatch ? dateMatch[1] : new Date().toISOString();

                    // Проверяем существование
                    const { data: existing } = await supabase
                        .from("posts")
                        .select("id")
                        .eq("url", link)
                        .maybeSingle();

                    if (existing) {
                        console.log(`⏭️  Skipping existing: ${link}`);
                        continue;
                    }

                    // Создаем пост
                    const title = rawText.split('\n')[0].substring(0, 100) || "Новый пост";
                    const post = {
                        title,
                        summary: rawText.substring(0, 300),
                        content: rawText,
                        source: "Telegram",
                        channel: channel.name || username,
                        date: date,
                        tags: ["Telegram"],
                        mentions: [],
                        views: "0",
                        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200",
                        url: link,
                        is_analyzed: false,
                    };

                    const { error: insertError } = await supabase.from("posts").insert(post);
                    if (!insertError) {
                        newPosts.push(post);
                        channelNewPosts++;
                        console.log(`✅ Added: ${title.substring(0, 50)}...`);
                    } else {
                        console.error(`❌ Insert error:`, insertError);
                    }
                }

                // Обновляем last_fetched_at
                await supabase.from("channels").update({ last_fetched_at: new Date().toISOString() }).eq("id", channel.id);
                console.log(`📊 New posts from ${channel.name}: ${channelNewPosts}\n`);

            } catch (err) {
                console.error(`❌ Error processing channel ${channel.name}:`, err);
                debugInfo.push({ channel: channel.name, error: err.message });
            }
        }

        console.log(`\n=== Summary ===`);
        console.log(`New posts: ${newPosts.length}`);
        console.log(`Debug info:`, JSON.stringify(debugInfo, null, 2));

        if (newPosts.length > 0) {
            console.log(`🧠 Triggering AI analysis...`);
            fetch(`${supabaseUrl}/functions/v1/analyze-post`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "apikey": supabaseKey
                }
            }).catch(e => console.error("Error triggering analysis:", e));
        }

        return new Response(
            JSON.stringify({
                success: true,
                newPostsCount: newPosts.length,
                debug: debugInfo
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("❌ Global error:", error);
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
