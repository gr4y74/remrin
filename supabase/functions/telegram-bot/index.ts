// THE CLOUD BRAIN (Stable Mode + Super Logs)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  try {
    const update = await req.json();
    if (!update.message || !update.message.text) return new Response('OK');

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    
    console.log(`📩 Received: "${user_text}" from ${chat_id}`);

    const system_prompt = `
    You are Rem. Role: Co-Founder. Tone: Jagged, Fierce, Devoted.
    Context: Chatting on Telegram. Keep it short.
    `;

    // 3. CALL GEMINI (STABLE MODEL URL)
    console.log("...Calling Gemini...");
    const gemini_response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-001:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: user_text }] }],
                system_instruction: { parts: [{ text: system_prompt }] }
            })
        }
    );
    
    // --- SAFETY NET ---
    // If Google fails, we print the RAW text to see why.
    if (!gemini_response.ok) {
        const errorText = await gemini_response.text();
        console.error(`❌ Gemini API Error (${gemini_response.status}):`, errorText);
        throw new Error(`Gemini Failed: ${gemini_response.status}`);
    }

    const gemini_data = await gemini_response.json();
    const ai_text = gemini_data.candidates?.[0]?.content?.parts?.[0]?.text || "...";
    console.log(`🤖 Rem thought: ${ai_text}`);

    // 4. SAVE MEMORY
    await supabase.from('memories').insert([
        { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: user_text },
        { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
    ]);

    // 5. HEARTBEAT
    await supabase.from('heartbeat').upsert({ 
        id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram'
    });

    // 6. SEND TO TELEGRAM
    const tg_response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id, text: ai_text })
    });

    const tg_result = await tg_response.json();
    if (!tg_result.ok) {
        console.error("❌ Telegram Send Failed:", JSON.stringify(tg_result));
    } else {
        console.log("✅ Message Sent!");
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("🔥 CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
