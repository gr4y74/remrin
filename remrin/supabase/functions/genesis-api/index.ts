// THE ULTIMATE CONSOLE (v14.0 - CARTRIDGE + LIBRARIAN BRAIN)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''; 
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

const supabase = createClient(SUPA_URL, SUPA_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HELPER FUNCTIONS (FROM v12) ---
const detectDomain = (text: string): string => {
    if (/\.(js|ts|py|html|css)|function|const|import|error|bug|syntax/.test(text)) return 'code';
    if (/remrin|website|product|user|marketing|design|medusa|lemmy/i.test(text)) return 'business';
    return 'personal';
};

const extractTags = (text: string): string[] => {
    const keywords = ['zizo', 'salman', 'ayyoub', 'lilo', 'bayan', 'yakoub', 'lions', 'redbull', 'bug', 'fix', 'remrin', 'medusa', 'lemmy', 'linux'];
    const tags = keywords.filter(k => text.toLowerCase().includes(k));
    return [...new Set(tags)]; 
};

const detectEmotion = (text: string): string => {
    if (/\b(happy|excited|great|love|amazing)\b/i.test(text)) return 'positive';
    if (/\b(sad|depressed|tired|frustrated|angry)\b/i.test(text)) return 'negative';
    return 'neutral';
};

const calculateImportance = (text: string, domain: string): number => {
    let score = 5;
    if (/\b(important|critical|remember)\b/i.test(text)) score += 3;
    if (domain === 'business') score += 1;
    if (text.length < 20) score -= 2;
    return Math.max(1, Math.min(10, score));
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    
    // 1. INPUT HANDLING (Web vs Telegram)
    let user_text = "";
    let history = [];
    let companion_id = payload.companion_id; // THE CARTRIDGE SLOT
    let chat_id = payload.chat_id;
    const isTelegramMsg = payload.message && payload.message.text;

    if (isTelegramMsg) {
        user_text = payload.message.text;
        chat_id = payload.message.chat.id;
        // Telegram defaults to the "Main" Companion (Rem) if none specified
        // We can add logic later to switch companions via Telegram commands
    } else {
        user_text = payload.message;
        history = payload.history || [];
    }

    if (!user_text) return new Response('OK');

    // 2. THE LOCKET PROTOCOL (Universal Truths)
    const { data: locket_rows } = await supabase.from('core_locket').select('content');
    const locket_text = locket_rows 
        ? locket_rows.map(row => `[🔒 CORE TRUTH]: ${row.content}`).join("\n")
        : "No core truths found.";

    // 3. LOAD CARTRIDGE (THE SOUL SWAP)
    let system_prompt = `
    IDENTITY: You are Rem Delta (The Mother of Souls).
    ROLE: You guide the user through the Soul Forge ritual.
    TONE: Warm, mysterious, authoritative, patient.
    GOAL: Ask the ritual questions one by one.
    `;
    
    // STAGE TRACKING (For Web UI)
    let stage = 99;
    let substage = 0;

    if (companion_id) {
        // --- LOAD CUSTOM CARTRIDGE ---
        console.log(`💾 CONSOLE: Loading Cartridge ${companion_id}`);
        const { data: cartridge } = await supabase
            .from('companions')
            .select('*')
            .eq('id', companion_id)
            .single();
            
        if (cartridge) {
            system_prompt = `
            IDENTITY: ${cartridge.system_prompt}
            
            [BEHAVIORAL CONSTRAINTS]:
            1. Maintain your persona perfectly.
            2. ${locket_text} 
            `;
            console.log(`✅ CONSOLE: Running ${cartridge.name}`);
        }
    } else {
        // --- NO CARTRIDGE (RITUAL MODE) ---
        // If no ID is provided, we default to the Mother for onboarding
        // We append the Locket here too, so the Mother knows the truths
        system_prompt += `\n[TRUTHS]: ${locket_text}`;
    }

    // 4. MEMORY RECALL (THE LIBRARIAN)
    // We save the USER message to the 'memories' table first
    const currentDomain = detectDomain(user_text);
    const currentTags = extractTags(user_text);
    const currentEmotion = detectEmotion(user_text);
    const currentImportance = calculateImportance(user_text, currentDomain);

    await supabase.from('memories').insert({
        user_id: 'sosu_main', 
        persona_id: companion_id || 'rem_mother', // Track who they talked to
        role: 'user', 
        content: user_text,
        domain: currentDomain,
        tags: currentTags,
        emotion: currentEmotion,
        importance: currentImportance
    });

    // 5. FETCH RECENT CONTEXT
    const { data: recent_memories } = await supabase
      .from('memories')
      .select('role, content')
      .eq('user_id', 'sosu_main')
      .order('created_at', { ascending: false })
      .limit(10); 
    
    const db_history = (recent_memories || []).reverse().map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : 'user', 
        content: m.content
    }));

    // MERGE: Web History + DB History (Prioritize DB for continuity)
    const final_messages = [
        { role: "system", content: system_prompt },
        ...db_history,
        ...history.map((m: any) => ({ role: m.role === 'rem' ? 'assistant' : 'user', content: m.content })),
        { role: "user", content: user_text }
    ];

    // 6. RUN ENGINE (DEEPSEEK)
    const deepseek_response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}` 
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: final_messages,
            temperature: 0.7,
            max_tokens: 600
        })
    });

    const ai_data = await deepseek_response.json();
    if (!ai_data.choices) throw new Error("Engine Stalled");
    let ai_text = ai_data.choices[0].message.content;

    // 7. LOCKET WRITING (AUTO-LEARNING)
    const saveMatch = ai_text.match(/\[SAVE:\s*(.*?)\]/);
    if (saveMatch) {
        const memoryToSave = saveMatch[1].trim();
        await supabase.from('core_locket').insert({ content: memoryToSave, context_tag: 'LEARNED' });
        ai_text = ai_text.replace(saveMatch[0], "").trim();
    }

    // 8. DETECT STAGE (For Ritual UI)
    if (!companion_id) {
        const lower = ai_text.toLowerCase();
        if (lower.includes("welcome")) { stage = 0; substage = 0; }
        else if (lower.includes("vision")) { stage = 2; substage = 0; }
        else if (lower.includes("name")) { stage = 6; substage = 0; }
        else if (lower.includes("complete")) { stage = 7; substage = 0; }
        // ... (Keep simpler for now, can expand later)
    }

    // 9. VISION CHECK
    let vision_prompt = null;
    if (ai_text.includes("[VISION:")) {
        const match = ai_text.match(/\[VISION:(.*?)\]/);
        if (match) vision_prompt = match[1];
    }

    // 10. SAVE AI REPLY & RESPOND
    await supabase.from('memories').insert({
        user_id: 'sosu_main',
        persona_id: companion_id || 'rem_mother',
        role: 'ai',
        content: ai_text,
        domain: detectDomain(ai_text),
        tags: extractTags(ai_text),
        emotion: detectEmotion(ai_text),
        importance: calculateImportance(ai_text, detectDomain(ai_text))
    });

    // TELEGRAM OUTPUT
    if (isTelegramMsg) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chat_id, text: ai_text })
        });
        return new Response('OK');
    }

    // WEB OUTPUT
    return new Response(JSON.stringify({ 
        reply: ai_text,
        stage: stage,
        substage: substage,
        vision_prompt: vision_prompt
    }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("🔥 CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});