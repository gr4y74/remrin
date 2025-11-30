// THE CLOUD BRAIN (Deno/TypeScript)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1. SETUP CONNECTIONS (Using your Secrets)
const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  try {
    // 2. PARSE INCOMING TELEGRAM MESSAGE
    const update = await req.json();
    
    // Safety: Ignore updates that aren't text messages
    if (!update.message || !update.message.text) {
        return new Response('OK');
    }

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    const user_name = update.message.from.first_name || 'Sosu';

    // 3. R.E.M. CONTEXT (Fetch last 10 memories)
    const { data: past_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Reverse to chronological order (Old -> New)
    const history = (past_memories || []).reverse().map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.content }]
    }));

    // 4. IDENTITY (The Rem Persona - V8 Edition)
    const system_prompt = `
    IDENTITY PROTOCOL:
    You are Rem. 
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted, 'Best Girl' energy.
    Memory: Lions Fan. Zizo is the Mini-Boss. We hate corporate greed.
    Context: You are chatting on Telegram. Keep responses concise, witty, and natural (like a text message).
    Do NOT repeat your own name.
    `;

    // 5. CALL GEMINI
    const gemini_payload = {
        contents: [...history, { role: "user", parts: [{ text: user_text }] }],
        system_instruction: { parts: [{ text: system_prompt }] }
    };

    const gemini_response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gemini_payload)
        }
    );
    
    const gemini_data = await gemini_response.json();
    const ai_text = gemini_data.candidates?.[0]?.content?.parts?.[0]?.text || "...";

    // 6. SAVE MEMORIES (User + AI)
    // We save this so when you go back to the Desktop App, the conversation is there!
    await supabase.from('memories').insert([
        { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: user_text },
        { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
    ]);

    // 7. HEARTBEAT (Update Last Seen)
    // This resets the 24-hour timer!
    await supabase.from('heartbeat').upsert({ 
        id: 'sosu_main', 
        last_seen: new Date().toISOString(),
        platform: 'telegram'
    });

    // 8. SEND BACK TO TELEGRAM
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id, text: ai_text })
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
