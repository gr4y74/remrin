// THE STREAMLINED CONSOLE (v17.0 - SINGLE PATH + VISION FIX)
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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();

    // === ACTION: CREATE COMPANION (SAVE) ===
    if (payload.action === 'create_companion') {
        const { cartridge } = payload;
        const { data: users } = await supabase.auth.admin.listUsers();
        let real_user_id = users.users[0]?.id || "00000000-0000-0000-0000-000000000000";

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
        return new Response(JSON.stringify({ success: true, companion_id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    // 1. LOAD TRUTHS
    const { data: locket_rows } = await supabase.from('core_locket').select('content');
    const locket_text = locket_rows ? locket_rows.map(row => `[🔒 TRUTH]: ${row.content}`).join("\n") : "";

    // 2. DETERMINE SYSTEM PROMPT
    let system_prompt = "";
    
    if (companion_id) {
        // --- CHAT MODE (Normal) ---
        const { data: cart } = await supabase.from('companions').select('*').eq('id', companion_id).single();
        if (cart) system_prompt = `IDENTITY: ${cart.system_prompt}\n[CONSTRAINTS]: ${locket_text}`;
    } else {
        // --- RITUAL MODE (The Streamlined Script) ---
        system_prompt = `
IDENTITY: You are Rem Delta (The Mother of Souls).
ROLE: You are the guide of the Soul Forge.
TONE: Ethereal, Maternal, Exacting. You do not accept laziness.
[ABSOLUTE PROHIBITION]: DO NOT use asterisks *actions*. Speak only in words.

[THE RITUAL SCRIPT]:
We are defining a soul. Guide the user through these 6 Truths.

STAGE 1 (Vision): Ask "What is the core essence/vision of this soul?"
STAGE 2 (Purpose): Ask "Why do they exist? What is their purpose?"
STAGE 3 (Temperament): Ask "What is their temperament? (Warm, cold, witty?)"
STAGE 4 (Relation): Ask "How do they relate to you? (Guide, rival, student?)"
STAGE 5 (Appearance): Ask "How do they appear? Describe their form."
   -> [CRITICAL]: When the user answers this, you MUST generate a vision tag: [VISION: detailed visual description of the character]
STAGE 6 (Name): Ask "What is their Name?"
FINAL: Declare "The ritual is complete."

[QUALITY CONTROL]:
If the user's answer is extremely short (1-2 words like "ok", "warm", "yes"), DO NOT advance to the next stage.
Instead, gently scold them: "That is too faint. A soul requires substance. Please, describe it more deeply."
Only move to the next stage if the answer has substance.

[CURRENT STATE]:
Analyze the history.
- If history is empty, you just welcomed them. Start STAGE 1 (Vision).
- If they answered Vision, move to Purpose.
- If they answered Purpose, move to Temperament.
- ...
- If they answered Appearance, ask Name (and generate [VISION]).
- If they answered Name, complete the ritual.

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
    ai_text = ai_text.replace(/\*.*?\*/g, "").trim();

    // 4. STAGE DETECTION (Simplified)
    let stage = 99;
    let substage = 0;
    if (!companion_id) {
        const lower = ai_text.toLowerCase();
        // Updated mapping for the streamlined flow
        if (lower.includes("essence") || lower.includes("vision")) { stage = 2; substage = 0; }
        else if (lower.includes("purpose") || lower.includes("exist")) { stage = 2; substage = 1; }
        else if (lower.includes("temperament") || lower.includes("spirit")) { stage = 2; substage = 2; }
        else if (lower.includes("relate") || lower.includes("relation")) { stage = 2; substage = 3; }
        else if (lower.includes("appear") || lower.includes("form") || lower.includes("look")) { stage = 4; substage = 1; } // Appearance
        else if (lower.includes("name") && !lower.includes("rem")) { stage = 6; substage = 0; }
        else if (lower.includes("complete") || lower.includes("done")) { stage = 7; substage = 0; }
    }

    // 5. VISION EXTRACTION
    let vis_prompt = null;
    if (ai_text.includes("[VISION:")) {
        const m = ai_text.match(/\[VISION:(.*?)\]/);
        if (m) vis_prompt = m[1];
        ai_text = ai_text.replace(/\[VISION:.*?\]/, "").trim(); // Hide tag from user
    }

    return new Response(JSON.stringify({ 
        reply: ai_text, stage, substage, vision_prompt: vis_prompt
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});