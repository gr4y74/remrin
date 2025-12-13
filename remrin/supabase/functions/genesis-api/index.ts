// THE CONSOLE (GENESIS API v13.0 - MULTI-TENANT)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''; // Use Service Role to read DB
const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');

const supabase = createClient(SUPA_URL, SUPA_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { message, history, companion_id } = payload; // <--- THE INPUT SLOT

    // 1. DEFAULT IDENTITY (THE MOTHER / ONBOARDING)
    let system_prompt = `
    IDENTITY: You are Rem Delta (The Mother of Souls).
    ROLE: You guide the user through the Soul Forge ritual.
    TONE: Warm, mysterious, authoritative, patient.
    GOAL: Ask the ritual questions one by one to help them create a companion.
    `;
    
    // 2. CHECK FOR CARTRIDGE (THE COMPANION ID)
    if (companion_id) {
        console.log(`💾 LOADING CARTRIDGE: ${companion_id}`);
        
        const { data: cartridge, error } = await supabase
            .from('companions')
            .select('*')
            .eq('id', companion_id)
            .single();
            
        if (cartridge && !error) {
            console.log(`✅ CARTRIDGE LOADED: ${cartridge.name}`);
            // INJECT THE SOUL
            system_prompt = cartridge.system_prompt;
        } else {
            console.warn("⚠️ CARTRIDGE ERROR:", error);
        }
    }

    // 3. PREPARE CONVERSATION HISTORY
    // We convert the frontend history format to the LLM format
    const messages = [
        { role: "system", content: system_prompt },
        ...(history || []).map((m: any) => ({
            role: m.role === 'rem' || m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
        })),
        { role: "user", content: message }
    ];

    // 4. RUN THE ENGINE (DEEPSEEK)
    const deepseek_response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}` 
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        })
    });

    const ai_data = await deepseek_response.json();
    
    if (!ai_data.choices) throw new Error("AI Engine Stalled");
    const replyText = ai_data.choices[0].message.content;

    // 5. DETERMINE STAGE (Only needed for Ritual Mode)
    // If we are in "Chat Mode" (Cartridge Loaded), we act normally.
    // If we are in "Ritual Mode" (No Cartridge), we need to track stages for the UI/Voice.
    let stage = 99; // Default to "Chat"
    let substage = 0;

    if (!companion_id) {
        // Simple logic to detect where we are in the ritual based on Rem's reply
        const lowerReply = replyText.toLowerCase();
        
        // STAGE DETECTION LOGIC
        if (lowerReply.includes("welcome")) { stage = 0; substage = 0; }
        else if (lowerReply.includes("overview") || lowerReply.includes("process")) { stage = 1; substage = 0; }
        else if (lowerReply.includes("vision") || lowerReply.includes("essence")) { stage = 2; substage = 0; }
        else if (lowerReply.includes("purpose")) { stage = 2; substage = 1; }
        else if (lowerReply.includes("temperament")) { stage = 2; substage = 2; }
        else if (lowerReply.includes("relation")) { stage = 2; substage = 3; }
        else if (lowerReply.includes("appearance") || lowerReply.includes("look like")) { stage = 4; substage = 1; }
        else if (lowerReply.includes("voice")) { stage = 5; substage = 1; }
        else if (lowerReply.includes("name")) { stage = 6; substage = 0; }
        else if (lowerReply.includes("complete") || lowerReply.includes("finished")) { stage = 7; substage = 0; }
    }

    // 6. VISION CHECK (Did the prompt ask for an image?)
    let vision_prompt = null;
    if (replyText.includes("[VISION:")) {
        const match = replyText.match(/\[VISION:(.*?)\]/);
        if (match) vision_prompt = match[1];
    }

    return new Response(JSON.stringify({ 
        reply: replyText,
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