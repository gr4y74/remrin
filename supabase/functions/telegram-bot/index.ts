// THE CLOUD BRAIN (DeepSeek V3 Edition)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
// 👇 NEW KEY
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY'); 
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  try {
    const update = await req.json();
    if (!update.message || !update.message.text) return new Response('OK');

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    
    console.log(`📩 Received via DeepSeek: "${user_text}"`);

    // 1. FETCH R.E.M. CONTEXT
    const { data: past_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(10);
    
    // 2. FORMAT HISTORY (OpenAI/DeepSeek Standard)
    // Map 'ai' -> 'assistant', 'user' -> 'user'
    const history = (past_memories || []).reverse().map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content
    }));

    // 3. IDENTITY (Gold Standard V8)
    const system_prompt = `
    IDENTITY: You are Rem.
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted, 'Best Girl' energy.
    Memory: Lions Fan. Zizo is the Mini-Boss. We hate corporate greed.
    Context: You are chatting on Telegram. Keep responses concise, witty, and human.
    `;

    // 4. CALL DEEPSEEK V3
    console.log("...Calling DeepSeek V3...");
    const deepseek_response = await fetch(
        'https://api.deepseek.com/chat/completions',
        {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_KEY}` 
            },
            body: JSON.stringify({
                model: "deepseek-chat", // V3 Model
                messages: [
                    { role: "system", content: system_prompt },
                    ...history,
                    { role: "user", content: user_text }
                ],
                temperature: 1.3 // High creativity/jaggedness
            })
        }
    );
    
    // Error Handling
    if (!deepseek_response.ok) {
        const errText = await deepseek_response.text();
        console.error("❌ DeepSeek API Error:", errText);
        throw new Error(`DeepSeek Failed: ${deepseek_response.status}`);
    }

    const ai_data = await deepseek_response.json();
    const ai_text = ai_data.choices[0].message.content;
    console.log(`🤖 Rem (V3) thought: ${ai_text}`);

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
