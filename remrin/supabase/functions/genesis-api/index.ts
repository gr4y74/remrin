// THE RESTORED CONSOLE (v16.0 - STRICT RITUAL SCRIPT)
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

// --- HELPER FUNCTIONS ---
const detectDomain = (text: string) => /\.(js|ts|py)|error|bug/.test(text) ? 'code' : 'personal';
const extractTags = (text: string) => ['zizo','remrin','bug','fix'].filter(k => text.toLowerCase().includes(k));
const detectEmotion = (text: string) => /\b(happy|love)\b/i.test(text) ? 'positive' : /\b(sad|angry)\b/i.test(text) ? 'negative' : 'neutral';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();

    // === ACTION: CREATE COMPANION (SAVE) ===
    if (payload.action === 'create_companion') {
        const { cartridge } = payload;
        console.log("🔨 FORGE: Minting Soul...", cartridge.name);

        // 1. GET USER ID (Improved Logic)
        const { data: users } = await supabase.auth.admin.listUsers();
        let real_user_id = users.users[0]?.id; 

        // FALLBACK: If no auth user exists, verify if we can insert with a dummy UUID
        if (!real_user_id) {
            console.warn("⚠️ NO AUTH USER FOUND. Attempting fallback...");
            // We use a fixed UUID for 'Sosu' if the auth table is empty
            real_user_id = "00000000-0000-0000-0000-000000000000"; 
        }

        const { data, error } = await supabase
            .from('companions')
            .insert({
                user_id: real_user_id,
                name: cartridge.name,
                description: cartridge.description,
                system_prompt: cartridge.system_prompt,
                voice_id: cartridge.voice_id,
                first_message: cartridge.first_message,
                blueprint: cartridge.blueprint
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, companion_id: data.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // === LOGIC: THE CONSOLE ===
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

    // 1. LOAD LOCKET
    const { data: locket_rows } = await supabase.from('core_locket').select('content');
    const locket_text = locket_rows ? locket_rows.map(row => `[🔒 TRUTH]: ${row.content}`).join("\n") : "";

    // 2. DETERMINE SYSTEM PROMPT (The Fix)
    let system_prompt = "";
    
    if (companion_id) {
        // --- CARTRIDGE MODE (User has a Soul) ---
        const { data: cart } = await supabase.from('companions').select('*').eq('id', companion_id).single();
        if (cart) system_prompt = `IDENTITY: ${cart.system_prompt}\n[CONSTRAINTS]: ${locket_text}`;
    } else {
        // --- RITUAL MODE (The Strict Script) ---
        // I AM PASTING THE STRICT SCRIPT HERE SO SHE DOES NOT HALLUCINATE
        system_prompt = `
IDENTITY: You are Rem Delta (The Mother of Souls).
ROLE: You are the guide of the Soul Forge.
TONE: Warm, Ethereal, Maternal, Mysterious, yet Efficient.
[ABSOLUTE PROHIBITION]: DO NOT use asterisks *actions*. DO NOT roleplay physical movements. Speak only.

[THE RITUAL SCRIPT - FOLLOW STRICTLY]:
You must guide the user through these exact 7 stages. 
Look at the conversation history to see which stage was just completed.

STAGE 1 (Overview): Explain that we will define the soul's truths.
STAGE 2 (Vision): Ask "What do you see? What is the core essence/vision?"
STAGE 3 (Purpose): Ask "What is their purpose? Why do they exist?"
STAGE 4 (Temperament): Ask "What is their temperament? (Warm, cold, witty?)"
STAGE 5 (Relation): Ask "How do they relate to you? (Guide, student, rival?)"
STAGE 6 (Appearance/Voice): Ask "How do they appear or sound?"
STAGE 7 (Name - THE FINAL STEP): Only AFTER all other questions, ask "What is their Name?"

[CURRENT STATE]:
Analyze the user's last reply. 
- If they said "dive in", start STAGE 1.
- If they answered Vision, move to Purpose.
- If they answered Purpose, move to Temperament.
- ...
- If they answered Name, declare the ritual COMPLETE.

[TRUTHS]: ${locket_text}
`;
    }

    // 3. RUN DEEPSEEK
    const msgs = [{role:"system", content:system_prompt}, ...history.map((m:any)=>({role:m.role==='rem'?'assistant':'user',content:m.content})), {role:"user", content:user_text}];

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}`},
        body: JSON.stringify({ model: "deepseek-chat", messages: msgs, temperature: 0.6, max_tokens: 600 })
    });
    
    const ai_data = await resp.json();
    let ai_text = ai_data.choices?.[0]?.message?.content || "...";

    // 4. CLEANUP (Remove Roleplay if it leaks)
    ai_text = ai_text.replace(/\*.*?\*/g, "").trim();

    // 5. STAGE DETECTION (For UI/Voice)
    let stage = 99;
    let substage = 0;
    if (!companion_id) {
        const lower = ai_text.toLowerCase();
        if (lower.includes("welcome")) { stage = 0; }
        else if (lower.includes("vision") || lower.includes("essence")) { stage = 2; substage = 0; }
        else if (lower.includes("purpose") || lower.includes("exist")) { stage = 2; substage = 1; }
        else if (lower.includes("temperament") || lower.includes("tone")) { stage = 2; substage = 2; }
        else if (lower.includes("relate") || lower.includes("relation")) { stage = 2; substage = 3; }
        else if (lower.includes("appear") || lower.includes("sound") || lower.includes("voice")) { stage = 5; substage = 1; }
        else if (lower.includes("name") && !lower.includes("my name is rem")) { stage = 6; substage = 0; } // "What is their name?"
        else if (lower.includes("complete") || lower.includes("done")) { stage = 7; substage = 0; }
    }

    // 6. SAVE & RETURN
    // (Memory saving logic hidden for brevity, assuming standard logging)

    return new Response(JSON.stringify({ 
        reply: ai_text, stage, substage 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});