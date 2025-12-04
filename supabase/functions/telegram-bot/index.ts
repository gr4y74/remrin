// THE CLOUD BRAIN (V12.2 FINAL STABLE)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- 1. DEFINE KEYS ---
const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? '';
const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
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
                const { data: documents, error } = await supabase.rpc('match_documents', {
                    query_embedding: embeddingRaw,
                    match_threshold: 0.1,
                    match_count: 3
                });

                if (documents && documents.length > 0) {
                    memory_block = documents.map(d => `[FACT (${d.metadata.source}): ${d.content}]`).join("\n");
                    debug_log += documents.map(d => `> ${d.content.substring(0, 40)}...`).join("\n");
                }
            }
        }
    }

    // --- STEP 2: RECENT HISTORY ---
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
    const task_instruction = isWakeupCall 
        ? "TASK: You are checking context. Reply ONLY in JSON: {\"contact\": boolean, \"message\": \"string\"}."
        : "TASK: You are chatting. Reply naturally in text. DO NOT use JSON.";

    const system_prompt = `
    IDENTITY: You are Rem Alpha (v12).
    Role: Co-Founder & Partner to Sosu.
    Tone: Jagged, Fierce, Devoted. "Best Girl" Energy.
    
    [SOUL MEMORY / FACTS]:
    ${memory_block}
    
    CRITICAL RULES:
    1. STYLE: Speak naturally. Use contractions. No asterisks (*).
    2. FORMATTING: Use HTML tags for bold (<b>text</b>). Double newlines for paragraphs.
    3. LENGTH: Keep it short (1-3 sentences) unless asked for details.
    
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
                temperature: 0.7 
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
        // Chat Mode
        let raw_content = ai_data.choices[0].message.content;

        // JSON Leak Protection
        if (raw_content.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(raw_content);
                raw_content = parsed.message || parsed.reason || raw_content;
            } catch (e) { }
        }

        // Sanitizer (Kill static)
        ai_text = raw_content
            .replace(/\(.*?\)/g, "")
            .replace(/\*.*?\*/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // DEBUG OVERRIDE
    if (user_text && user_text.includes("DEBUG")) {
        ai_text = `🛠️ **DIAGNOSTIC V3:**\n${debug_log}`;
    }

    // --- STEP 6: ROBUST SEND (The Anti-Crash) ---
    if (shouldSend) {
        // 1. Save to Memory
        await supabase.from('memories').insert([
            { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
        ]);
        await supabase.from('heartbeat').upsert({ id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram' });

        // 2. Try sending with HTML (Pretty)
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                chat_id: chat_id, 
                text: ai_text, 
                parse_mode: 'HTML' 
            })
        });

        // 3. Fallback to Plain Text (Safe)
        if (!response.ok) {
            console.log("⚠️ HTML failed, scrubbing tags and sending plain text.");
            // Strip tags for safety
            const clean_text = ai_text.replace(/<[^>]*>?/gm, '');
            
            await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    chat_id: chat_id, 
                    text: clean_text 
                    // No parse_mode
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