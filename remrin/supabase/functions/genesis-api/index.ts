// THE ULTIMATE CONSOLE (v15.0 - CARTRIDGE SAVER ENABLED)
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

// ... (Helper functions detectDomain, extractTags, etc. remain the same) ...
// TO SAVE SPACE, I AM ASSUMING YOU KEEP THE HELPER FUNCTIONS FROM V14 HERE
// IF YOU NEED THEM REPRINTED, LET ME KNOW. OTHERWISE, PASTE THEM HERE.
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

    // === NEW: THE FORGE ACTION (SAVE CARTRIDGE) ===
    if (payload.action === 'create_companion') {
        const { cartridge } = payload;
        console.log("🔨 FORGE: Minting new Soul...", cartridge.name);

        // 1. Get a User ID (For now, we default to 'sosu_main' since no login exists yet)
        // In the future, this comes from req.headers.authorization
        const owner_id = 'sosu_main'; 

        // 2. CHECK IF USER EXISTS IN AUTH (Hack for local testing without real auth)
        // We will just insert directly assuming 'sosu_main' is mapped or we bypass RLS by using Service Role.
        // NOTE: Ensure your 'companions' table has a 'user_id' column that accepts text or UUID.
        // If it requires strict UUID from auth.users, we might need a real UUID.
        // For this prototype, we'll try to insert. If it fails on UUID, we might need to fetch a real ID.
        
        // Let's assume you want to own it.
        // If this fails, we will need to grab your real UUID from the 'auth.users' table in Supabase dashboard.
        // For now, let's try.
        
        // We need a valid UUID for the database constraint usually. 
        // Let's fetch the FIRST user from auth.users to assign ownership to (You).
        const { data: users } = await supabase.auth.admin.listUsers();
        const real_user_id = users.users[0]?.id; // Grabs YOUR id

        if (!real_user_id) throw new Error("No User Found to assign Soul to.");

        const { data, error } = await supabase
            .from('companions')
            .insert({
                user_id: real_user_id,
                name: cartridge.name,
                description: cartridge.description,
                system_prompt: cartridge.system_prompt,
                voice_id: cartridge.voice_id,
                first_message: cartridge.first_message,
                blueprint: cartridge.blueprint // Save raw answers
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, companion_id: data.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
    // ==============================================

    // ... (THE REST OF THE V14 LOGIC: INPUT, LOCKET, CARTRIDGE LOADING, DEEPSEEK) ...
    // COPY THE REST OF V14 LOGIC BELOW HERE (INPUT HANDLING -> LOCKET -> DEEPSEEK -> RESPONSE)
    
    // 1. INPUT HANDLING
    let user_text = "";
    let history = [];
    let companion_id = payload.companion_id;
    let chat_id = payload.chat_id;
    const isTelegramMsg = payload.message && payload.message.text;

    if (isTelegramMsg) {
        user_text = payload.message.text;
        chat_id = payload.message.chat.id;
    } else {
        user_text = payload.message;
        history = payload.history || [];
    }

    if (!user_text) return new Response('OK');

    // 2. LOCKET
    const { data: locket_rows } = await supabase.from('core_locket').select('content');
    const locket_text = locket_rows ? locket_rows.map(row => `[🔒 TRUTH]: ${row.content}`).join("\n") : "";

    // 3. LOAD CARTRIDGE
    let system_prompt = `IDENTITY: Rem Delta (Mother). ROLE: Guide. TONE: Warm. GOAL: Ask ritual questions.`;
    let stage = 99;
    let substage = 0;

    if (companion_id) {
        const { data: cart } = await supabase.from('companions').select('*').eq('id', companion_id).single();
        if (cart) system_prompt = `IDENTITY: ${cart.system_prompt}\n[CONSTRAINTS]: ${locket_text}`;
    } else {
        system_prompt += `\n[TRUTHS]: ${locket_text}`;
    }

    // 4. MEMORY SAVE (User)
    await supabase.from('memories').insert({
        user_id: 'sosu_main', persona_id: companion_id || 'rem_mother', role: 'user', content: user_text,
        domain: detectDomain(user_text), tags: extractTags(user_text), emotion: detectEmotion(user_text), importance: 5
    });

    // 5. HISTORY & DEEPSEEK
    const { data: recents } = await supabase.from('memories').select('role, content').eq('user_id', 'sosu_main').order('created_at', {ascending:false}).limit(10);
    const db_hist = (recents||[]).reverse().map((m:any)=>({role:m.role==='ai'?'assistant':'user', content:m.content}));
    
    const msgs = [{role:"system", content:system_prompt}, ...db_hist, ...history.map((m:any)=>({role:m.role==='rem'?'assistant':'user',content:m.content})), {role:"user", content:user_text}];

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}`},
        body: JSON.stringify({ model: "deepseek-chat", messages: msgs, temperature: 0.7, max_tokens: 600 })
    });
    
    const ai_data = await resp.json();
    let ai_text = ai_data.choices?.[0]?.message?.content || "...";

    // 6. LOCKET SAVE
    const saveMatch = ai_text.match(/\[SAVE:\s*(.*?)\]/);
    if (saveMatch) {
        await supabase.from('core_locket').insert({ content: saveMatch[1].trim(), context_tag: 'LEARNED' });
        ai_text = ai_text.replace(saveMatch[0], "").trim();
    }

    // 7. STAGE DETECTION (Ritual)
    if (!companion_id) {
        const lower = ai_text.toLowerCase();
        if (lower.includes("welcome")) { stage = 0; substage = 0; }
        else if (lower.includes("vision")) { stage = 2; substage = 0; }
        else if (lower.includes("name")) { stage = 6; substage = 0; }
        else if (lower.includes("complete")) { stage = 7; substage = 0; }
    }

    // 8. VISION & SAVE (AI)
    let vis_prompt = null;
    if (ai_text.includes("[VISION:")) {
        const m = ai_text.match(/\[VISION:(.*?)\]/);
        if (m) vis_prompt = m[1];
    }

    await supabase.from('memories').insert({
        user_id: 'sosu_main', persona_id: companion_id || 'rem_mother', role: 'ai', content: ai_text,
        domain: detectDomain(ai_text), tags: extractTags(ai_text), emotion: detectEmotion(ai_text), importance: 5
    });

    if (isTelegramMsg) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({chat_id, text:ai_text})
        });
        return new Response('OK');
    }

    return new Response(JSON.stringify({ 
        reply: ai_text, stage, substage, vision_prompt: vis_prompt
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});