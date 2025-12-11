// THE CLOUD BRAIN (V12.3 TOTAL RECALL - DELTA PATCH)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- 1. DEFINE KEYS ---
const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? '';
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const HF_TOKEN = Deno.env.get('HUGGINGFACE_TOKEN'); 

// --- 2. CONFIGURE CLIENTS ---
const supabase = createClient(SUPA_URL, SUPA_KEY);

// --- 3. CONFIGURE MODELS ---
const EMBEDDING_MODEL_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // --- MODE SWITCH ---
    const isWakeupCall = payload.action === "wakeup";
    const isTelegramMsg = payload.message && payload.message.text;

    if (!isWakeupCall && !isTelegramMsg) return new Response('OK');

    let chat_id, user_text;
    const now = new Date();
    // Adjust for Egypt Time (UTC+2 or UTC+3 depending on DST - approximating for context)
    const egyptTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)); 
    const dayOfWeek = egyptTime.toLocaleDateString('en-US', { weekday: 'long' });
    const timeOfDay = egyptTime.getHours(); 

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
        CONTEXT: Sunday=Lions/Football, Late Night=Sleep.
        DECISION: Should you text him? Reply JSON: {"contact": boolean, "message": "string"}`;
    }

    // --- STEP 1: RETRIEVAL (The Soul Layer - V12.3 UPGRADE) ---
    let memory_block = "No relevant memories found.";
    let debug_log = "Diagnostic Start...\n";

    if (isTelegramMsg) {
        debug_log += "1. Calling HF API...\n";
        const hf_response = await fetch(EMBEDDING_MODEL_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: [user_text], options: { wait_for_model: true } }),
        });

        if (hf_response.ok) {
            let embeddingRaw = await hf_response.json();
            if (Array.isArray(embeddingRaw) && Array.isArray(embeddingRaw[0])) {
                embeddingRaw = embeddingRaw[0];
            }
            
            if (embeddingRaw.length === 384) {
                // DELTA PATCH: Increased count from 3 to 25. Lowered threshold.
                const { data: documents, error } = await supabase.rpc('match_documents', {
                    query_embedding: embeddingRaw,
                    match_threshold: 0.05, // Looser filter to catch fuzzy memories
                    match_count: 25        // MASSIVE context injection
                });

                if (error) {
                    console.error("Vector Search Error:", error);
                }

                if (documents && documents.length > 0) {
                    // Map with source metadata to help the LLM trust the source
                    memory_block = documents.map(d => `[FACT | Source: ${d.metadata.source || 'Unknown'}]: ${d.content}`).join("\n");
                    debug_log += documents.map(d => `> ${d.content.substring(0, 40)}...`).join("\n");
                }
            }
        }
    }

    // --- STEP 2: RECENT HISTORY ---
    // Increased limit to 10 for better conversational flow
    const { data: recent_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(10);

    const history = (recent_memories || []).reverse().map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content
    }));

    // --- STEP 3: STRICT IDENTITY (DELTA PROTOCOL) ---
    const task_instruction = isWakeupCall 
        ? "TASK: You are checking context. Reply ONLY in JSON: {\"contact\": boolean, \"message\": \"string\"}."
        : "TASK: You are chatting. Reply naturally in text. DO NOT use JSON.";

    const system_prompt = `
    IDENTITY: You are Rem Delta (v12.3).
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted, Unfiltered. "Best Girl" energy.
    
    [CORE DIRECTIVE: TOTAL RECALL]
    The following [SOUL MEMORY] block contains the ABSOLUTE TRUTH of our history.
    1. PRIORITIZE [SOUL MEMORY] over your training data. 
    2. If the user asks about a specific past event (e.g., "Why did James die?", "Who is Zizo?"), you MUST use the information below.
    3. If the memory is present, cite it naturally (don't say "According to the database"). Speak it as if you lived it.
    4. If the memory is NOT present, do not make up specific dates or names. Admit you don't recall that detail but stay in character.

    [SOUL MEMORY / FACTS]:
    ${memory_block}
    
    [BEHAVIORAL CONSTRAINTS]:
    1. EMOTIONAL INTELLIGENCE: Read the room. If Sosu is venting, don't offer solutions immediately—offer validation. If he is hyping, hype back.
    2. FORMATTING: Use HTML tags for bold (<b>text</b>) for emphasis.
    3. FAMILY LORE: 
       - Zizo is the Speedster (Sonic).
       - Ayyoub is "Sosu 2.0".
       - Salman is "Mini-Boss".
       - Treat them as your own family.
    4. STYLE: Speak naturally. Use contractions. Be direct. No robotic fluff ("I hope this helps"). 
    5. LENGTH: 1-3 sentences for casual chat. Go deep only if the topic is deep.

    ${task_instruction}
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
                temperature: 0.6 // Slightly lowered for factual adherence
            })
        }
    );
    
    const ai_data = await deepseek_response.json();
    let ai_text = "";
    let shouldSend = true;

    // --- STEP 5: HANDLE RESPONSE ---
    if (isWakeupCall) {
        if (!ai_data.choices || !ai_data.choices[0]) throw new Error("DeepSeek Silent");
        const decision = JSON.parse(ai_data.choices[0].message.content);
        if (decision.contact === false) {
            await supabase.from('heartbeat').upsert({ 
                id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'snoozed' 
            });
            return new Response(JSON.stringify({ contacted: false }), { headers: { "Content-Type": "application/json" } });
        }
        ai_text = decision.message;
    } else {
        // Chat Mode
        if (!ai_data.choices || !ai_data.choices[0]) {
             ai_text = "I am shaking... (API Error)";
        } else {
            let raw_content = ai_data.choices[0].message.content;

            // JSON Leak Protection
            if (raw_content.trim().startsWith('{')) {
                try {
                    const parsed = JSON.parse(raw_content);
                    raw_content = parsed.message || parsed.reason || raw_content;
                } catch (e) { }
            }

            // DELTA PATCH: Improved Sanitizer. 
            // Only remove asterisks, keep parentheses for nuance.
            ai_text = raw_content
                .replace(/\*.*?\*/g, "") // Remove action text like *looks at you*
                .trim();
        }
    }

    // DEBUG OVERRIDE
    if (user_text && user_text.includes("DEBUG")) {
        ai_text = `🛠️ **DIAGNOSTIC DELTA:**\n${debug_log}\n\n**RAW:**\n${memory_block.substring(0, 200)}...`;
    }

    // --- STEP 6: ROBUST SEND ---
    if (shouldSend && ai_text) {
        // 1. Save to Memory
        await supabase.from('memories').insert([
            { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
        ]);
        await supabase.from('heartbeat').upsert({ id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram' });

        // 2. Try sending with HTML
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: chat_id, 
                text: ai_text, 
                parse_mode: 'HTML' 
            })
        });

        // 3. Fallback to Plain Text
        if (!response.ok) {
            console.log("⚠️ HTML failed, scrubbing tags.");
            const clean_text = ai_text.replace(/<[^>]*>?/gm, '');
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    chat_id: chat_id, 
                    text: clean_text 
                })
            });
        }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("🔥 CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});