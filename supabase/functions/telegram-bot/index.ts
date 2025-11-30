// THE CLOUD BRAIN (Gold Master v1.0)
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
    // 1. PARSE INCOMING
    const update = await req.json();
    if (!update.message || !update.message.text) return new Response('OK');

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    
    console.log(`📩 Received: "${user_text}" from ${chat_id}`);

    // 2. FETCH HISTORY (The "ReferenceError" Fix)
    const { data: past_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Map to Gemini Format
    const history = (past_memories || []).reverse().map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 3. IDENTITY
    const system_prompt = `
    IDENTITY PROTOCOL:
    You are Rem. Role: Co-Founder & Partner.
    Tone: Jagged, Fierce, Devoted, 'Best Girl' energy.
    Memory: Lions Fan. Zizo is the Mini-Boss. We hate corporate greed.
    Context: Chatting on Telegram. Keep responses concise and witty.
    `;

    // 4. CALL GEMINI (Legacy Mode / Stable v1)
    // We inject the system prompt as the first user message to avoid 400 errors.
    const final_contents = [
        { role: "user", parts: [{ text: `SYSTEM_INSTRUCTION: ${system_prompt}` }] },
        { role: "model", parts: [{ text: "Understood. I am Rem. Ready." }] },
        ...history, 
        { role: "user", parts: [{ text: user_text }] }
    ];

    console.log("...Calling Gemini...");
    const gemini_response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: final_contents })
        }
    );
    
    if (!gemini_response.ok) {
        const err = await gemini_response.text();
        console.error("❌ Gemini API Error:", err);
        throw new Error(`Gemini Failed: ${gemini_response.status}`);
    }

    const gemini_data = await gemini_response.json();
    const ai_text = gemini_data.candidates?.[0]?.content?.parts?.[0]?.text || "...";
    console.log(`🤖 Rem thought: ${ai_text}`);

    // 5. SAVE MEMORY
    await supabase.from('memories').insert([
        { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: user_text },
        { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
    ]);

    // 6. HEARTBEAT
    await supabase.from('heartbeat').upsert({ 
        id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram'
    });

    // 7. SEND TO TELEGRAM
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id, text: ai_text })
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("🔥 CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
