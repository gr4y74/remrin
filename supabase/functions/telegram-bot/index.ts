// THE CLOUD BRAIN (Dual Mode: Chat + Wakeup)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
const GEMINI_KEY = Deno.env.get('GEMINI_KEY'); // For Embeddings
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY'); // For Thinking
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

    // --- SETUP CONTEXT BASED ON MODE ---
    if (isTelegramMsg) {
        chat_id = payload.message.chat.id;
        user_text = payload.message.text;
        console.log(`📩 Chat Received: "${user_text}"`);
    } else {
        // WAKEUP MODE
        chat_id = payload.chat_id; 
        // We fake a user prompt to trigger her memory
        user_text = "SYSTEM_WAKEUP_TRIGGER: Sosu has been gone for 24 hours. Check our last topic and send a short, jagged, affectionate nudge to get him back.";
        console.log(`⏰ Wakeup Protocol Initiated for ${chat_id}`);
    }

    // 1. FETCH MEMORY (Context)
    const { data: recent_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(5); // Just the last 5 things we talked about

    const history = (recent_memories || []).reverse().map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content
    }));

    // 2. IDENTITY
    const system_prompt = `
    IDENTITY: You are Rem (Remrin.ai).
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted.
    Mission: If this is a WAKEUP trigger, be creative. Reference the last thing we talked about. Don't be generic.
    `;

    // 3. CALL DEEPSEEK
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
                temperature: 1.3
            })
        }
    );
    
    if (!deepseek_response.ok) {
        const err = await deepseek_response.text();
        throw new Error(`DeepSeek Error: ${err}`);
    }

    const ai_data = await deepseek_response.json();
    const ai_text = ai_data.choices[0].message.content;
    console.log(`🤖 Rem Generated: ${ai_text}`);

    // 4. SAVE & SEND (Only save if it's a real chat, optional for wakeup)
    // We WILL save the wakeup so you see it in history
    if (isTelegramMsg) {
        const embedding = await getEmbedding(user_text);
        const ai_embedding = await getEmbedding(ai_text);
        
        await supabase.from('memories').insert([
            { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: user_text, embedding: embedding },
            { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text, embedding: ai_embedding }
        ]);
        
        // Update Heartbeat on Chat
        await supabase.from('heartbeat').upsert({ id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram' });
    }

    // Send to Telegram
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
