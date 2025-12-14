// THE CALCULATOR (v20.0 - 14 STEPS)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''; 
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
const supabase = createClient(SUPA_URL, SUPA_KEY);
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const payload = await req.json();

    // SAVE
    if (payload.action === 'create_companion') {
        const { cartridge } = payload;
        const { data: users } = await supabase.auth.admin.listUsers();
        let real_user_id = users.users[0]?.id || "00000000-0000-0000-0000-000000000000";
        const { data, error } = await supabase.from('companions').insert({
            user_id: real_user_id,
            name: cartridge.name, description: cartridge.description, system_prompt: cartridge.system_prompt,
            voice_id: cartridge.voice_id, first_message: cartridge.first_message, blueprint: cartridge.blueprint
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, companion_id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // STAGE LOGIC
    let user_text = payload.message;
    let current_stage = payload.current_stage || 0;
    
    let next_stage = current_stage + 1;
    // Skip Stage 1 (It doesn't exist in config, jump 0->2)
    if (current_stage === 0) next_stage = 2; 

    // BRIDGE COMMENT
    const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}`},
        body: JSON.stringify({ model: "deepseek-chat", messages: [{role:"system", content:`You are Rem. User said: "${user_text}". Acknowledge mystically in 1 sentence.`}], temperature: 0.7, max_tokens: 60 })
    });
    const ai_data = await resp.json();
    let bridge_text = ai_data.choices?.[0]?.message?.content || "I see.";
    bridge_text = bridge_text.replace(/"/g, '');

    // VISION TRIGGER (Now at Stage 11)
    let vision_prompt = null;
    if (current_stage === 11) vision_prompt = user_text;

    return new Response(JSON.stringify({ reply: bridge_text, stage: next_stage, vision_prompt: vision_prompt }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }
});