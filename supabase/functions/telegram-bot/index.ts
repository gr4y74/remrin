// THE CLOUD BRAIN (Hybrid: DeepSeek V3 Chat + Gemini Memory)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
const GEMINI_KEY = Deno.env.get('GEMINI_KEY'); // Used for Memory
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY'); // Used for Chat
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

// --- HELPER: GENERATE EMBEDDING (Google) ---
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
    const update = await req.json();
    if (!update.message || !update.message.text) return new Response('OK');

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    console.log(`📩 Received: "${user_text}"`);

    // 1. GENERATE EMBEDDING FOR USER QUERY
    // We turn your text into math so we can search the database
    const embedding = await getEmbedding(user_text);

    // 2. SEMANTIC SEARCH (The R.E.M. Upgrade)
    // Instead of "Last 10", we ask: "Find memories related to this text"
    const { data: similar_memories } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.5, // Sensitivity (0.1 = loose, 0.9 = exact)
      match_count: 5 // Get top 5 relevant memories
    });

    // Also fetch extremely recent context (Short term memory)
    const { data: recent_memories } = await supabase
      .from('memories')
      .select('role, content')
      .order('created_at', { ascending: false })
      .limit(3);

    // Combine them (Unique deduplication)
    const combined_raw = [...(similar_memories || []), ...(recent_memories || [])];
    // Map to DeepSeek format
    const history = combined_raw.reverse().map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content
    }));

    console.log(`🧠 R.E.M. Context: Found ${similar_memories?.length || 0} semantic matches.`);

    // 3. IDENTITY (Gold Standard V8)
    const system_prompt = `
    IDENTITY: You are Rem.
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted, 'Best Girl' energy.
    Memory: You have access to deep storage. Use the context provided to answer.
    Context: Chatting on Telegram. Keep responses concise, witty, and human.
    `;

    // 4. CALL DEEPSEEK V3 (The Chat Brain)
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
                    ...history, // Injected Memories
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
    console.log(`🤖 Rem thought: ${ai_text}`);

    // 5. SAVE MEMORY + EMBEDDING
    // We generate an embedding for your text AND her reply so we can find them later
    const ai_embedding = await getEmbedding(ai_text);

    await supabase.from('memories').insert([
        { 
            user_id: 'sosu_main', persona_id: 'rem', role: 'user', 
            content: user_text, embedding: embedding 
        },
        { 
            user_id: 'sosu_main', persona_id: 'rem', role: 'ai', 
            content: ai_text, embedding: ai_embedding 
        }
    ]);

    // 6. HEARTBEAT & REPLY
    await supabase.from('heartbeat').upsert({ id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram' });

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
