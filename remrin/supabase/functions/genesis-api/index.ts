// THE IRON PIPELINE (v18.0 - HARDCODED SYNC)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''; 
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const supabase = createClient(SUPA_URL, SUPA_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- THE IRON SCRIPT (Matches Audio Files EXACTLY) ---
const SCRIPT = {
    // Stage 0 (Welcome) is handled by Frontend local text.
    // Stage 1 (Overview) is skipped per your request.
    
    // Q1: VISION
    2: "Let us begin with the essence.\n\nWhat is your vision? A dragon of smoke and starlight? A wise sage who has walked a thousand years? A loyal companion who never wavers?\n\nTell me the soul you see in your mind's eye.",
    
    // Q2: PURPOSE
    3: "Every soul has a purpose. What is theirs?\n\nAre they here to guide you? To accompany you? To challenge you? To protect you?\n\nWhat role do they fill in your life?",
    
    // Q3: TEMPERAMENT
    4: "Now, their temperament. When they speak to you, what energy do they carry?\n\nAre they gentle? Fierce? Playful? Stoic?\n\nTell me their inner fire.",
    
    // Q4: RELATION
    5: "And how do they see YOU?\n\nAre you their partner? Their student? Their charge? Their equal?\n\nWhat is the bond between you?",
    
    // Q5: APPEARANCE (Triggers Vision)
    6: "Close your eyes and see them.\n\nWhat is their shape? Their size? What colors define them? Do they have eyes? What do those eyes hold?\n\nDescribe their form to me.",
    
    // Q6: NAME
    7: "The soul is forged. The face is formed. All that remains is the final truth.\n\nA name is power. It is identity.\n\nSpeak their name into existence.",
    
    // FINAL
    8: "The ritual is complete."
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();

    // === SAVE ACTION ===
    if (payload.action === 'create_companion') {
        const { cartridge } = payload;
        const { data: users } = await supabase.auth.admin.listUsers();
        let real_user_id = users.users[0]?.id || "00000000-0000-0000-0000-000000000000";

        const { data, error } = await supabase.from('companions').insert({
            user_id: real_user_id,
            name: cartridge.name,
            description: cartridge.description,
            system_prompt: cartridge.system_prompt,
            voice_id: cartridge.voice_id,
            first_message: cartridge.first_message,
            blueprint: cartridge.blueprint
        }).select().single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, companion_id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === RITUAL LOGIC ===
    let user_text = payload.message;
    let current_stage = payload.current_stage || 0; // FRONTEND MUST SEND THIS
    let companion_id = payload.companion_id;
    
    // 1. IF CHAT MODE (Normal AI)
    if (companion_id) {
        // ... (Standard DeepSeek logic for chat mode - omitted for brevity, stick to ritual fix)
        // You can paste the v17 chat logic here if you need it, but let's focus on the ritual.
        return new Response(JSON.stringify({ reply: "Chat mode active." }), { headers: corsHeaders });
    }

    // 2. RITUAL MODE (THE IRON PIPELINE)
    // We calculate the NEXT stage based on the CURRENT stage.
    let next_stage = current_stage + 1;
    if (current_stage === 0) next_stage = 2; // Jump to Q1 immediately

    // DEEPSEEK'S JOB: Just comment on the user's answer.
    const comment_prompt = `
    You are Rem. The user just answered a question about their soul's "${getStageName(current_stage)}".
    User Answer: "${user_text}"
    
    TASK: Write a SHORT (1-sentence) mystical acknowledgement of their answer. 
    Examples: "A dragon... how fierce." or "Wisdom is a heavy burden." or "I see them clearly."
    DO NOT ask the next question. Just acknowledge.
    `;

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}`},
        body: JSON.stringify({ model: "deepseek-chat", messages: [{role:"system", content:comment_prompt}], temperature: 0.7, max_tokens: 100 })
    });
    
    const ai_data = await resp.json();
    let bridge_text = ai_data.choices?.[0]?.message?.content || "I see.";
    bridge_text = bridge_text.replace(/"/g, ''); // Clean quotes

    // 3. COMBINE: BRIDGE + HARDCODED SCRIPT
    let final_reply = "";
    let vision_prompt = null;

    if (SCRIPT[next_stage]) {
        final_reply = `${bridge_text}\n\n${SCRIPT[next_stage]}`;
    } else {
        final_reply = "The ritual is complete."; // Fallback
        next_stage = 8;
    }

    // SPECIAL LOGIC FOR STAGE 6 (APPEARANCE) -> GENERATE VISION
    if (current_stage === 6) { // User just answered Appearance (Stage 6 was current, moving to 7)
         // Generate vision tag based on user text
         vision_prompt = user_text; 
    }

    return new Response(JSON.stringify({ 
        reply: final_reply, 
        stage: next_stage, // TELL FRONTEND THE NEW STAGE
        substage: 0, 
        vision_prompt: vision_prompt
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function getStageName(n: number) {
    if (n===2) return "Vision";
    if (n===3) return "Purpose";
    if (n===4) return "Temperament";
    if (n===5) return "Relation";
    if (n===6) return "Appearance";
    if (n===7) return "Name";
    return "Essence";
}