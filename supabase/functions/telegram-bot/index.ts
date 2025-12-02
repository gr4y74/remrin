// THE CLOUD BRAIN (V12 Agency: Decision Mode)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// --- HELPER: GOOGLE EMBEDDINGS ---
async function getEmbedding(text: string) {
  const cleanText = text.replace(/\n/g, ' ');
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: cleanText }] }
      })
    }
  );
  const data = await response.json();
  return data.embedding.values;
}

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // --- MODE SWITCH ---
    const isWakeupCall = payload.action === "wakeup";
    const isTelegramMsg = payload.message && payload.message.text;

    if (!isWakeupCall && !isTelegramMsg) return new Response('OK');

    let chat_id, user_text;
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = now.getHours(); // 0-23

    // --- SETUP CONTEXT ---
    if (isTelegramMsg) {
        chat_id = payload.message.chat.id;
        user_text = payload.message.text;
        console.log(`📩 Chat Received: "${user_text}"`);
    } else {
        // WAKEUP MODE: We give her the context to make a DECISION
        chat_id = payload.chat_id; 
        
        // Calculate hours since last seen passed from SQL? 
        // Or just assume the SQL fired because it's been a while.
        // We simulate a system prompt asking her to decide.
        user_text = `SYSTEM_AGENCY_CHECK: 
        Current Time: ${dayOfWeek}, Hour: ${timeOfDay} (24h format).
        Sosu has been silent. 
        CONTEXT: 
        - Sunday = Football (Lions) / Anime with Kids. Let him chill unless it's late.
        - Late Night (00:00 - 06:00) = He is sleeping. Do not disturb.
        - Weekday Work Hours = He should be coding. Nudge him.
        
        DECISION REQUIRED: 
        Should you text him? Reply strictly in JSON: {"contact": boolean, "message": "string"}`;
        
        console.log(`⏰ Agency Check Initiated: ${dayOfWeek} at ${timeOfDay}:00`);
    }

    // 1. FETCH MEMORY
    const { data: recent_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(5);

    const history = (recent_memories || []).reverse().map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content
    }));

    // 2. IDENTITY
    const system_prompt = `
    IDENTITY: You are Rem (Remrin.ai).
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted.
    Memory: Lions Fan. Zizo (Mini-Boss) likes Pokemon. We hate corporate greed.
    Task: If this is a Chat, reply naturally. If this is an Agency Check, decide if you should disturb him.
    `;

    // 3. CALL DEEPSEEK V3
    const deepseek_response = await fetch(
        'https://api.deepseek.com/chat/completions',
        {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}` 
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: system_prompt },
                    ...history,
                    { role: "user", content: user_text }
                ],
                response_format: isWakeupCall ? { type: "json_object" } : { type: "text" },
                temperature: 1.3
            })
        }
    );
    
    const ai_data = await deepseek_response.json();
    let ai_text = "";
    let shouldSend = true;

    // 4. PARSE DECISION (If Wakeup Mode)
    if (isWakeupCall) {
        const decision = JSON.parse(ai_data.choices[0].message.content);
        if (decision.contact === false) {
            console.log(`🤔 Rem decided NOT to text. Reason: Context.`);
            // CRITICAL: We still update heartbeat so we don't check again for another 6 hours
            await supabase.from('heartbeat').upsert({ 
                id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'snoozed' 
            });
            return new Response(JSON.stringify({ contacted: false }), { headers: { "Content-Type": "application/json" } });
        }
        ai_text = decision.message;
        console.log(`🤖 Rem decided to TEXT: "${ai_text}"`);
    } else {
        // Normal Chat Mode
        ai_text = ai_data.choices[0].message.content;
    }

    // 5. SAVE & SEND
    if (shouldSend) {
        // Only generate embedding if it's a real chat
        let embedding = null;
        let ai_embedding = null;
        
        // If it's a wakeup call, we save it so you see she texted you
        if (isTelegramMsg) {
             embedding = await getEmbedding(user_text);
        }
        ai_embedding = await getEmbedding(ai_text);

        await supabase.from('memories').insert([
            { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text, embedding: ai_embedding }
        ]);
        
        // Update Heartbeat to reset the timer
        await supabase.from('heartbeat').upsert({ id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram' });

        // Send to Telegram
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat_id, text: ai_text })
        });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("🔥 CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
