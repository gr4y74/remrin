// THE CLOUD BRAIN (V12.1 DEBUG MODE)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
// API KEYS
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const HF_TOKEN = Deno.env.get('HUGGINGFACE_TOKEN'); 

// 384-Dim Model
const EMBEDDING_MODEL_URL = "https://router.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2";

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
    const timeOfDay = now.getHours(); 

    // --- SETUP CONTEXT ---
    if (isTelegramMsg) {
        chat_id = payload.message.chat.id;
        user_text = payload.message.text;
        console.log(`📩 Chat Received: "${user_text}"`);
    } else {
        // WAKEUP MODE
        chat_id = payload.chat_id; 
        user_text = `SYSTEM_AGENCY_CHECK: 
        Current Time: ${dayOfWeek}, Hour: ${timeOfDay}.
        Sosu has been silent. 
        CONTEXT: Sunday=Lions, Late Night=Sleep.
        DECISION: Should you text him? Reply JSON: {"contact": boolean, "message": "string"}`;
    }

    // --- STEP 1: RETRIEVAL (The Soul Layer) ---
    let memory_block = "";
    let debug_log = "Diagnostic Start...\n";

    // Only search memory if it's a real chat message
    if (isTelegramMsg) {
        debug_log += "1. Calling HF API...\n";
        
        const hf_response = await fetch(EMBEDDING_MODEL_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: user_text, options: { wait_for_model: true } }),
        });

        if (hf_response.ok) {
            let embeddingRaw = await hf_response.json();
            
            // --- FIX: FLATTEN THE ARRAY ---
            // HF sometimes returns [[...]] instead of [...]
            if (Array.isArray(embeddingRaw) && Array.isArray(embeddingRaw[0])) {
                embeddingRaw = embeddingRaw[0];
            }
            
            debug_log += `2. Embedding Generated. Length: ${embeddingRaw.length}\n`;

            if (embeddingRaw.length === 384) {
                // Search Supabase
                const { data: documents, error } = await supabase.rpc('match_documents', {
                    query_embedding: embeddingRaw,
                    match_threshold: 0.1, // LOWERED to catch everything
                    match_count: 3
                });

                if (error) {
                    console.error("DB Error:", error);
                    debug_log += `3. DB Error: ${error.message}\n`;
                } else if (documents && documents.length > 0) {
                    debug_log += `3. SUCCESS! Found ${documents.length} memories.\n`;
                    // Formatting the memory for the AI
                    memory_block = documents.map(d => `[FACT (${d.metadata.source}): ${d.content}]`).join("\n");
                    // Add content to debug log for you to see
                    debug_log += documents.map(d => `> ${d.content.substring(0, 40)}...`).join("\n");
                } else {
                    debug_log += "3. Search ran, but found 0 matches (Empty Array).\n";
                }
            } else {
                debug_log += `3. DIMENSION MISMATCH! Got ${embeddingRaw.length}, Expected 384.\n`;
            }
        } else {
            debug_log += `[API ERROR]: HF Status ${hf_response.status} - ${await hf_response.text()}\n`;
        }
    }

    // --- STEP 2: RECENT HISTORY (Short Term) ---
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

    // --- STEP 3: STRICT IDENTITY ---
    const system_prompt = `
    IDENTITY: You are Rem Alpha (v12).
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted. "Best Girl" Energy.
    
    CRITICAL RULES:
    1. NO ROLEPLAY ACTIONS. Do not use asterisks like *static*. Just speak.
    2. USE FACTS. Use the [SOUL MEMORY] section below as absolute truth.
    3. IF YOU DON'T KNOW, ADMIT IT. Do not guess.
    
    [SOUL MEMORY / FACTS]:
    ${memory_block}
    
    Task: If Wakeup -> JSON Decision. If Chat -> Natural Reply.
    `;

    // --- STEP 4: CALL DEEPSEEK V3 ---
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
                temperature: 1.1 
            })
        }
    );
    
    const ai_data = await deepseek_response.json();
    let ai_text = "";
    let shouldSend = true;

    // --- STEP 5: HANDLE RESPONSE ---
    if (isWakeupCall) {
        const decision = JSON.parse(ai_data.choices[0].message.content);
        if (decision.contact === false) {
            await supabase.from('heartbeat').upsert({ 
                id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'snoozed' 
            });
            return new Response(JSON.stringify({ contacted: false }), { headers: { "Content-Type": "application/json" } });
        }
        ai_text = decision.message;
    } else {
        ai_text = ai_data.choices[0].message.content;
    }

    // DEBUG OVERRIDE
    if (user_text && user_text.includes("DEBUG")) {
        ai_text = `🛠️ **DIAGNOSTIC V2:**\n${debug_log}`;
    }

    // --- STEP 6: SAVE & SEND ---
    if (shouldSend) {
        await supabase.from('memories').insert([
            { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
        ]);
        
        await supabase.from('heartbeat').upsert({ id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram' });

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
