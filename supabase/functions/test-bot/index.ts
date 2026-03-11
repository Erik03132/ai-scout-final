// Тестовая функция для Telegram бота
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");

serve(async (req) => {
  try {
    console.log("=== TEST BOT FUNCTION CALLED ===");
    console.log("Method:", req.method);
    
    if (req.method === "GET") {
      return new Response(JSON.stringify({
        status: "ok",
        token_set: !!TELEGRAM_BOT_TOKEN,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Received update:", JSON.stringify(body, null, 2));

    // Отправляем тестовое сообщение
    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text;
      
      console.log(`Sending message to chat ${chatId}: ${text}`);
      
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `✅ Бот работает!\n\nВы написали: ${text}\n\nВремя: ${new Date().toISOString()}`,
            parse_mode: "Markdown",
          }),
        }
      );

      const result = await response.json();
      console.log("Telegram response:", result);

      if (!result.ok) {
        throw new Error(`Telegram error: ${result.description}`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
