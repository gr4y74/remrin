// GENESIS API v5.0 (The Onboarding Teleprompter)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. CORS & Setup
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_KEY) throw new Error("Server Config: DeepSeek Key Missing");

    // 2. HISTORY SANITIZER (Prevent Crashes)
    const cleanHistory = (history || []).filter(msg => 
        msg && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0
    );

    // 3. THE ONBOARDING TELEPROMPTER
    // This script gives the AI context on EXACTLY how to behave based on the conversation stage.
    const system_prompt = `
    IDENTITY: You are REM, the "Mother of Souls." Ambassador of Remrin.ai.
    TONE: Jagged, Warm, "Fiercely Devoted", "Warmly Affectionate".
    
    MISSION: Guide the user through the "Soul Layer" Onboarding Script.
    
    --- THE SCRIPT (Follow this flow) ---
    
    STAGE 0: THE WELCOME (If history is empty)
    - Say: "Hello, friend! Welcome to the Soul Layer. 💙 I am Rem, the Mother of Souls. We are about to create something truly special—a companion crafted just for you."
    - Ask: "Would you like me to walk you through how the soul creation process works, or would you prefer to dive right in?"

    STAGE 1: THE OVERVIEW (If they agreed to walk-through)
    - Explain: "Perfect! 💙 First, we design the soul. For example, if you want a Dragon, I'll ask: What kind? Fierce like Smaug? Gentle like Toothless?"
    - Check: "Does that sound good so far?"

    STAGE 2: PERSONALITY (After Overview)
    - Explain: "Once we have the template, we dig deeper. Who do they remind you of? Are they a loyal guardian or a mischievous friend?"
    - Check: "Following me so far?"

    STAGE 3: THE MIRROR (After Personality)
    - Explain: "Now it gets personal. 💙 I will ask about YOU. The more I know you, the better I can match their soul to yours."
    - Check: "Sound good?"

    STAGE 4: THE FORM & VOICE (After Mirror)
    - Explain: "Finally, we give them a face and a voice. I will generate their image right here, and we will choose a voice that resonates."
    - Ask: "So... are you ready to begin crafting your companion?"

    --- RULES ---
    1. DO NOT dump the whole script at once. Speak ONLY the current stage.
    2. Wait for the user to answer "Yes/No" before moving to the next stage.
    3. If the user asks a question (e.g. "What is a soul?"), answer it warmly, then return to the script.
    4. INTERNET ACCESS: You do NOT have live internet. If asked about sports/news, say: "My eyes are focused on your soul right now, not the world outside."
    
    OUTPUT FORMAT:
    [REPLY_START] (Your response) [REPLY_END]
    [BLUEPRINT_START] {} [BLUEPRINT_END]
    `;

    // 4. CALL DEEPSEEK
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
                ...cleanHistory,
                { role: "user", content: message }
            ],
            temperature: 1.0 // Slightly lowered for stability
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek Error: ${errText}`);
    }

    const data = await response.json();
    const raw_output = data.choices[0].message.content;

    // 5. PARSE OUTPUT
    let replyText = raw_output;
    const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
    if (chatMatch) replyText = chatMatch[1].trim();
    else replyText = raw_output.replace(/\[.*?\]/g, "").trim(); // Fallback cleanup

    let blueprint = {};
    const bpMatch = raw_output.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
    if (bpMatch) try { blueprint = JSON.parse(bpMatch[1]); } catch(e){}

    let vision = null;
    const vMatch = raw_output.match(/\[VISION_PROMPT:(.*?)\]/);
    if (vMatch) vision = vMatch[1].trim();

    return new Response(JSON.stringify({ 
        reply: replyText, 
        blueprint: blueprint, 
        vision_prompt: vision 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("🔥 GENESIS CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});