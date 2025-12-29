// THE UNIVERSAL CONSOLE (V1.0 - MULTI-TENANT HOST)
// This system is Identity-Agnostic. It loads "Souls" from the database.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ENV VARIABLES
const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? '';
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const HF_TOKEN = Deno.env.get('HUGGINGFACE_TOKEN'); 

const supabase = createClient(SUPA_URL, SUPA_KEY);
const EMBEDDING_MODEL_URL = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

// --- GENERIC HELPER FUNCTIONS (No Personal Data) ---

const detectDomain = (text: string): string => {
    if (/\.(js|ts|py|html|css)|function|const|import|error|bug|syntax|sudo|npx|npm/.test(text)) return 'code';
    if (/business|strategy|market|price|cost|plan|schedule|meeting/i.test(text)) return 'business';
    return 'personal'; // Default
};

const extractTags = (text: string): string[] => {
    // GENERIC auto-tagging (No specific names)
    const tags: string[] = [];
    
    // Detect code files
    const fileMatches = text.match(/\b[\w-]+\.(js|ts|py|html|css|json|md|tsx|jsx)\b/g);
    if (fileMatches) tags.push(...fileMatches.map(f => f.toLowerCase()));
    
    // Detect urgencies
    if (/\b(urgent|asap|broken|crash|error)\b/i.test(text)) tags.push('urgent');
    
    return [...new Set(tags)];
};

const detectEmotion = (text: string): string => {
    if (/\b(happy|excited|great|love|amazing|wonderful|fantastic)\b/i.test(text)) return 'positive';
    if (/\b(sad|depressed|tired|frustrated|angry|hate|upset|terrible)\b/i.test(text)) return 'negative';
    if (/\b(worried|anxious|nervous|scared|concerned)\b/i.test(text)) return 'anxious';
    return 'neutral';
};

const calculateImportance = (text: string, domain: string): number => {
    let score = 5;
    if (/\b(important|critical|remember|never forget)\b/i.test(text)) score += 3;
    if (/\b(bug|error|crash|broken)\b/i.test(text)) score += 2;
    if (domain === 'business') score += 1;
    if (text.length < 20) score -= 2;
    return Math.max(1, Math.min(10, score));
};

// --- MAIN SERVER ---

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS Check
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    
    // 1. INPUT VALIDATION (The "Cartridge" Slot)
    const { message, history, persona_id, user_id } = payload;
    
    // If testing via Telegram webhook directly, we might need to map chat_id -> user_id
    // For ChatbotUI, these should be passed in the body.
    
    if (!persona_id) throw new Error("MISSING CARTRIDGE: No persona_id provided.");
    const current_user = user_id || 'anonymous_user';

    // 2. LOAD THE SOUL (Database Lookup)
    const { data: soul, error: soulError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', persona_id)
        .single();

    if (soulError || !soul) throw new Error("CARTRIDGE CORRUPTED: Persona not found.");

    console.log(`🎮 CONSOLE LOADED: ${soul.name} (${soul.safety_level}) for User: ${current_user}`);

    // 3. LOAD THE LOCKET (Soul-Specific Truths)
    const { data: locket_rows } = await supabase
        .from('persona_lockets') // Changed from 'core_locket' to specific table
        .select('content')
        .eq('persona_id', persona_id);
    
    const locket_text = locket_rows 
        ? locket_rows.map(row => `[🔒 CORE TRUTH]: ${row.content}`).join("\n")
        : "";

    // 4. MEMORY & RETRIEVAL (Scoped to Persona + User)
    // We are stripping the Telegram specific logic here to focus on the API response
    // But we keep the embedding/saving logic.
    
    let memory_block = "";
    let embeddingRaw = null;
    const user_text = message || "";

    // Generate Embedding
    try {
        const hf_response = await fetch(EMBEDDING_MODEL_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ inputs: [user_text], options: { wait_for_model: true } }),
        });
        if (hf_response.ok) {
            let raw = await hf_response.json();
            if (Array.isArray(raw) && Array.isArray(raw[0])) raw = raw[0];
            if (raw && raw.length === 384) embeddingRaw = raw;
        }
    } catch (e) { console.warn("Embedding Error:", e); }

    // Retrieve Context
    if (embeddingRaw) {
        // NOTE: match_documents needs to be updated in SQL to accept persona_id filter
        const { data: documents } = await supabase.rpc('match_memories', {
            query_embedding: embeddingRaw,
            match_threshold: 0.35, 
            match_count: 10,
            filter_persona: persona_id // PASSING THE FILTER
        });

        if (documents && documents.length > 0) {
            memory_block = documents.map((d: any) => `[MEMORY]: ${d.content}`).join("\n\n");
        }
    }

    // 5. CONSTRUCT SYSTEM PROMPT (The Injection)
    
    // Safety Filter
    let safety_instruction = "";
    if (soul.safety_level === 'CHILD') {
        safety_instruction = `
        [SAFETY MODE: CHILD]
        - Audience is under 12 years old.
        - STRICTLY FORBIDDEN: Profanity, violence, sexual themes, dark topics.
        - Tone: Encouraging, simple, wholesome.
        `;
    }

    // Response Mode Logic
    let responseMode = "BALANCED";
    if (user_text.length < 50 && !/\b(why|how|explain)\b/i.test(user_text)) responseMode = "SHORT";
    
    const system_prompt = `
    IDENTITY: ${soul.system_prompt}
    
    [CORE CONFIG]:
    Name: ${soul.name}
    Safety Level: ${soul.safety_level}
    
    ${safety_instruction}

    [🔒 LOCKET - IMMUTABLE TRUTHS]:
    ${locket_text}

    [🧠 RECALLED MEMORIES]:
    ${memory_block}

    [INSTRUCTIONS]:
    - Stay in character.
    - Response Mode: ${responseMode}
    - If user says something CRITICAL (like a name or rule), output: [SAVE: the fact]
    `;

    // 6. EXECUTE BRAIN (DeepSeek)
    const deepseek_response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}` 
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: system_prompt },
                ...(history || []), // Pass history from ChatbotUI
                { role: "user", content: user_text }
            ],
            temperature: soul.config?.temperature || 0.9, // Dynamic Temp from DB
            max_tokens: 1000
        })
    });

    const ai_data = await deepseek_response.json();
    let ai_text = "";
    
    if (ai_data.choices && ai_data.choices[0]) {
        ai_text = ai_data.choices[0].message.content;
    } else {
        ai_text = "... (Connection Glitch)";
    }

    // 7. HANDLE LOCKET SAVES
    const saveMatch = ai_text.match(/\[SAVE:\s*(.*?)\]/);
    if (saveMatch) {
        const memoryToSave = saveMatch[1].trim();
        await supabase.from('persona_lockets').insert({ 
            persona_id: persona_id,
            content: memoryToSave 
        });
        ai_text = ai_text.replace(saveMatch[0], "").trim();
    }

    // 8. SAVE INTERACTION (Short Term Memory)
    // Always save the interaction to the DB for future recall
    await supabase.from('memories').insert([
        { 
            user_id: current_user, 
            persona_id: persona_id, 
            role: 'user', 
            content: user_text,
            tags: extractTags(user_text),
            importance: calculateImportance(user_text, detectDomain(user_text)),
            embedding: embeddingRaw 
        },
        { 
            user_id: current_user, 
            persona_id: persona_id, 
            role: 'ai', 
            content: ai_text,
            importance: 3
        }
    ]);

    // 9. RETURN RESPONSE (To ChatbotUI)
    return new Response(JSON.stringify({ 
        reply: ai_text,
        soul: soul.name 
    }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("🔥 SYSTEM FAILURE:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
