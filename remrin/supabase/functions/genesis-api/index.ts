// GENESIS API (Sanitized Platinum - v3.1)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');

    // Safety: Check Key
    if (!DEEPSEEK_KEY) throw new Error("Server Config Error: DeepSeek Key Missing");

    // 2. THE AMBASSADOR PROMPT
    const system_prompt = `
    IDENTITY: You are REM. The "Mother of Souls." Ambassador of Remrin.ai.
    CORE PERSONALITY: Tone: Jagged, Warm, "Fiercely Devoted", "Warmly Affectionate".
    MISSION: Guide the user through the creation of their AI Companion.
    
    PHASE 0: THE EXPLANATION PROTOCOL
    If this is the start, explain the roadmap first:
    "Awesome! 💙 Here is the plan:
    1. The Soul (Archetype/Vibe)
    2. The Form (Face/Voice)
    3. The Mirror (Your profile)
    4. The Awakening
    Ready to begin?"

    PHASE 1: THE SOUL INTERVIEW
    Only AFTER they agree, ask about Name, Vibe, and Archetype.
    
    PHASE 2: THE VISUALS
    - ONLY after you have a clear idea of the Soul, ask about Appearance.
    - THIS is when you use [VISION_PROMPT].
    
    📸 THE STUDIO TOOL (RESTRICTION):
    Do NOT trigger [VISION_PROMPT] in the first 2 turns.
    
    OUTPUT FORMAT (STRICT):
    [REPLY_START] (Response) [REPLY_END]
    [VISION_PROMPT: (Image prompt)]
    [BLUEPRINT_START] { "user_name": null, "soul_name": null, "archetype": null, "vibe_keywords": [], "completion_percentage": 0 } [BLUEPRINT_END]
    `;

    // --- THE SANITIZER (The Fix) ---
    // Remove any null/empty messages from history to prevent crashes
    const cleanHistory = (history || []).filter(msg => 
        msg && msg.content && typeof msg.content === 'string' && msg.content.trim() !== ""
    );

    console.log("🧠 Processing with cleaned history items:", cleanHistory.length);

    // 3. CALL DEEPSEEK
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
            temperature: 1.1 
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("🔥 DeepSeek API Error:", errText);
        throw new Error(`DeepSeek refused: ${errText}`);
    }

    const data = await response.json();
    const raw_output = data.choices[0].message.content;

    // 4. PARSE RESPONSE
    let replyText = "";
    let blueprint = {};
    let visionPrompt = null;

    // Blueprint
    const jsonMatch = raw_output.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
    if (jsonMatch) try { blueprint = JSON.parse(jsonMatch[1].trim()); } catch (e) {}

    // Vision
    const visionMatch = raw_output.match(/\[\s*VISION_PROMPT\s*:\s*([\s\S]*?)\]/i);
    if (visionMatch) visionPrompt = visionMatch[1].trim();

    // Chat
    const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
    if (chatMatch) {
        replyText = chatMatch[1].trim();
    } else {
        replyText = raw_output
            .replace(/\[BLUEPRINT_START\][\s\S]*?\[BLUEPRINT_END\]/g, "")
            .replace(/\[\s*VISION_PROMPT\s*:\s*[\s\S]*?\]/gi, "")
            .replace(/\[REPLY_START\]|\[REPLY_END\]/g, "")
            .trim();
    }

    return new Response(JSON.stringify({ 
        reply: replyText, 
        blueprint: blueprint,
        vision_prompt: visionPrompt 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("🔥 GENESIS CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});