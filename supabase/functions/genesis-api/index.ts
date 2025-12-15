// THE PERMANENT ARCHIVIST (v23.0 - IMAGE UPLOAD)
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

    // === SAVE ACTION ===
    if (payload.action === 'create_companion') {
        const { cartridge } = payload;
        console.log("💾 SAVING SOUL:", cartridge.name);

        const { data: users } = await supabase.auth.admin.listUsers();
        let real_user_id = users.users[0]?.id || "00000000-0000-0000-0000-000000000000";

        // === IMAGE PERSISTENCE MAGIC ===
        let permanent_avatar_url = null;
        
        // If we have a temp URL from Replicate
        if (cartridge.temp_image_url && cartridge.temp_image_url.startsWith('http')) {
            try {
                console.log("📥 DOWNLOADING TEMP IMAGE:", cartridge.temp_image_url);
                const imgResp = await fetch(cartridge.temp_image_url);
                if (imgResp.ok) {
                    const imgBlob = await imgResp.blob();
                    const fileName = `${real_user_id}/${Date.now()}_avatar.png`;

                    // Upload to 'avatars' bucket
                    const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('avatars')
                        .upload(fileName, imgBlob, { contentType: 'image/png', upsert: true });

                    if (uploadError) {
                        console.error("⚠️ UPLOAD FAILED:", uploadError);
                    } else {
                        // Get Public URL
                        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                        permanent_avatar_url = urlData.publicUrl;
                        console.log("✅ IMAGE SECURED:", permanent_avatar_url);
                    }
                }
            } catch (imgErr) {
                console.error("⚠️ IMAGE PERSISTENCE FAILED:", imgErr);
                // Proceed without image rather than crashing everything
            }
        }

        // Insert into DB
        const { data, error } = await supabase.from('companions').insert({
            user_id: real_user_id,
            name: cartridge.name, 
            description: cartridge.description, 
            system_prompt: cartridge.system_prompt,
            voice_id: cartridge.voice_id, 
            first_message: cartridge.first_message, 
            blueprint: cartridge.blueprint,
            avatar_url: permanent_avatar_url // Save the permanent link
        }).select().single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, companion_id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === RITUAL LOGIC (BRIDGE) ===
    let user_text = payload.message;
    let current_stage = payload.current_stage || 0;
    let next_stage = current_stage + 1;
    if (current_stage === 0) next_stage = 2; // Jump Welcome -> Vision

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
        method:'POST', headers:{'Content-Type':'application/json', 'Authorization':`Bearer ${DEEPSEEK_KEY}`},
        body: JSON.stringify({ model: "deepseek-chat", messages: [{role:"system", content:`You are Rem. User said: "${user_text}". Acknowledge mystically in 1 sentence.`}], temperature: 0.7, max_tokens: 60 })
    });
    const ai_data = await resp.json();
    let bridge_text = ai_data.choices?.[0]?.message?.content || "I see.";
    bridge_text = bridge_text.replace(/"/g, '');

    let vision_prompt = null;
    if (current_stage === 5) vision_prompt = user_text; // Trigger at Stage 5 (Appearance)

    return new Response(JSON.stringify({ reply: bridge_text, stage: next_stage, vision_prompt: vision_prompt }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});