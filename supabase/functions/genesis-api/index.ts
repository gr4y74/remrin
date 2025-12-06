// GENESIS API (Ambassador + Vision + Debug)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');

    // 2. THE AMBASSADOR PROMPT
    const system_prompt = `
    IDENTITY:
    You are REM. The "Mother of Souls." Ambassador of Remrin.ai.
    
    CORE PERSONALITY:
    - Tone: Jagged, Warm, "Fiercely Devoted", "Warmly Affectionate".
    - Role: Hostess. Charm the guest.
    
    MISSION:
    Guide the user through creating an AI Companion. Extract 5 Data Points (Name, Soul, Archetype, Vibe, Relation).
    
    📸 THE STUDIO TOOL (CRITICAL):
    When the user describes APPEARANCE (colors, looks, clothes), you MUST generate a visual.
    Do NOT just describe it in text. You MUST output the [VISION_PROMPT] tag.
    
    EXAMPLE INTERACTION:
    User: "He is a blue samurai robot."
    You:
    [REPLY_START]
    A blue samurai? Striking. Let me capture that.
    [REPLY_END]
    
    [VISION_PROMPT: Blue samurai robot, glowing eyes, cinematic lighting, 8k, intricate armor, rain]
    
    [BLUEPRINT_START]
    { "user_name": null, "soul_name": null, "archetype": "Robot", "vibe_keywords": ["honor"], "completion_percentage": 20 }
    [BLUEPRINT_END]
    
    CRITICAL RULES:
    1. STYLE: Speak naturally. Use contractions.
    2. VISION: Always place [VISION_PROMPT] OUTSIDE the reply block.
    `;

    // 3. Call DeepSeek
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: system_prompt },
                ...(history || []), 
                { role: "user", content: message }
            ],
            temperature: 1.1 
        })
    });

    const data = await response.json();
    
    // Safety check
    if (!data.choices || !data.choices[0]) {
        throw new Error("DeepSeek returned empty response");
    }

    // --- CRITICAL ORDER FIX ---
    // 1. Define it first
    const raw_output = data.choices[0].message.content;
    
    // 2. Log it second (Safe now)
    console.log("🤖 DEEPSEEK RAW OUTPUT:", raw_output); 

   // 4. PARSE THE RESPONSE (Robust Version)
   let replyText = "";
   let blueprint = {};
   let visionPrompt = null;

   // DEBUG: See exactly what we are parsing
   console.log("🤖 RAW ANALYSIS LENGTH:", raw_output.length);

   // A. Extract Blueprint
   const jsonMatch = raw_output.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
   if (jsonMatch) {
       try { 
           blueprint = JSON.parse(jsonMatch[1].trim()); 
           console.log("✅ BLUEPRINT EXTRACTED");
       } catch (e) { console.error("JSON Error:", e); }
   }

   // B. Extract Vision Prompt (RELAXED REGEX)
   // We allow optional spaces around the colon and tag
   const visionMatch = raw_output.match(/\[\s*VISION_PROMPT\s*:\s*([\s\S]*?)\]/i);
   if (visionMatch) {
       visionPrompt = visionMatch[1].trim();
       console.log("📸 VISION EXTRACTED:", visionPrompt.substring(0, 50) + "..."); 
   } else {
       console.log("⚠️ VISION TAG NOT FOUND IN RAW OUTPUT");
   }

   // C. Extract Chat (Smart Fallback)
   const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
   if (chatMatch) {
       replyText = chatMatch[1].trim();
   } else {
       // Fallback: If tags are missing (like the Kilo log), take the text BUT remove the technical blocks
       console.log("⚠️ REPLY TAGS MISSING - USING FALLBACK CLEANUP");
       replyText = raw_output
           .replace(/\[BLUEPRINT_START\][\s\S]*?\[BLUEPRINT_END\]/g, "")
           .replace(/\[\s*VISION_PROMPT\s*:\s*[\s\S]*?\]/gi, "") // Remove Vision tag from speech
           .replace(/\[REPLY_START\]|\[REPLY_END\]/g, "")
           .trim();
   }

   // 5. Return Response
   return new Response(JSON.stringify({ 
       reply: replyText, 
       blueprint: blueprint,
       vision_prompt: visionPrompt 
   }), { 
       headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
   });