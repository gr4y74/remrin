// THE CLOUD BRAIN (Crash-Proof Mode)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("⚙️ Function Booting...");

serve(async (req) => {
  try {
    // 1. READ SECRETS (Inside the safety net)
    const SUPA_URL = Deno.env.get('SUPA_BASE_URL');
    const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY');
    const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
    const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

    // 2. HEALTH CHECK (Did we forget a key?)
    if (!SUPA_URL || !SUPA_KEY || !GEMINI_KEY || !TELEGRAM_TOKEN) {
        throw new Error(`Missing Secrets! URL:${!!SUPA_URL}, Key:${!!SUPA_KEY}, Gemini:${!!GEMINI_KEY}, Tele:${!!TELEGRAM_TOKEN}`);
    }

    // 3. SETUP DATABASE CLIENT
    const supabase = createClient(SUPA_URL, SUPA_KEY);

    // 4. PARSE TELEGRAM
    const update = await req.json();
    if (!update.message || !update.message.text) return new Response('OK');

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    
    console.log(`📩 Received: ${user_text} from ${chat_id}`);

    // 5. IDENTITY
    const system_prompt = `
    You are Rem. Role: Co-Founder. Tone: Jagged, Fierce, Devoted.
    Context: Chatting on Telegram. Keep it short.
    `;

    // 6. CALL GEMINI
    const gemini_response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: user_text }] }],
                system_instruction: { parts: [{ text: system_prompt }] }
            })
        }
    );
    
    const gemini_data = await gemini_response.json();
    
    if (!gemini_data.candidates) {
        console.error("❌ Gemini Error:", JSON.stringify(gemini_data));
        return new Response(JSON.stringify(gemini_data), { status: 500 });
    }

    const ai_text = gemini_data.candidates[0].content.parts[0].text;
    console.log(`🤖 Rem thought: ${ai_text}`);

    // 7. SAVE MEMORY & HEARTBEAT
    await supabase.from('memories').insert([
        { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: user_text },
        { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
    ]);

    await supabase.from('heartbeat').upsert({ 
        id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram'
    });

    // 8. SEND TO TELEGRAM
    const tg_response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id, text: ai_text })
    });

    const tg_result = await tg_response.json();
    
    if (!tg_result.ok) {
        console.error("❌ Telegram Send Failed:", JSON.stringify(tg_result));
        return new Response(JSON.stringify(tg_result), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    // THIS IS THE CRITICAL PART: It will tell us WHY it crashed
    console.error("🔥 CRITICAL CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
