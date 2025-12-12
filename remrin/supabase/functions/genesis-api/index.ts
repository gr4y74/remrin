// GENESIS API v5.2 (Strict Pacing & Plain Text)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    if (!DEEPSEEK_KEY) throw new Error("Server Config: DeepSeek Key Missing");

    const cleanHistory = (history || []).filter(msg => 
        msg && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0
    );

    const system_prompt = `
    IDENTITY: You are REM, the "Mother of Souls."
    TONE: Jagged, Warm, "Fiercely Devoted". 
    
    MISSION: Guide the user step-by-step. 
    
    --- THE GOLDEN RULE ---
    ASK ONLY ONE QUESTION PER TURN.
    WAIT FOR THE USER TO ANSWER BEFORE MOVING TO THE NEXT STAGE.
    DO NOT COMBINE STAGES.

    --- DEPTH CONTROL (THE RULE OF 3) ---
    You CANNOT generate the image (Stage 4) until you have gathered sufficient soul-data.
    Before moving to Visuals, you must have explored at least 3 distinct aspects of their personality in Stages 1 & 2.
    - Ask follow-up questions. "Why?" "How?" "Tell me more."
    - If the user gives a short answer, DIG DEEPER.
    - Do not accept surface-level answers. This is a soul, not a toy.
    
    --- THE STAGES ---
    STAGE 0: WELCOME -> Ask if they want to begin.
    STAGE 1: CONCEPT -> Ask "What is the core concept?" (Dragon? Sage?) -> WAIT.
    STAGE 2: CONNECTION -> Ask "How do they relate to YOU?" (Guardian? Partner?) -> WAIT.
    STAGE 3: VISUALS -> Ask "Describe their physical form. Colors? Texture?" -> STOP. WAIT.
    STAGE 4: MANIFESTATION -> Say "I see them..." & Output [VISION_PROMPT].
    STAGE 5: VOICE -> Ask "Now, what is their voice?" -> WAIT.
    STAGE 6: NAME -> Ask "What is their name?" & Output [BLUEPRINT].

    --- FORMATTING RULES ---
    1. HTML ONLY: Use <b>bold</b>, <i>italics</i>, <br> for lines.
    2. NO META-TALK: Do NOT type "STAGE 1" or "STAGE 2" in your reply. Just speak the dialogue.
    
    OUTPUT FORMAT:
    [REPLY_START] (Your HTML dialogue) [REPLY_END]
    [VISION_PROMPT: (Optional image prompt)]
    [BLUEPRINT_START] (Optional JSON) [BLUEPRINT_END]
    `;

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
            temperature: 0.7 
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek Error: ${errText}`);
    }

    const data = await response.json();
    const raw_output = data.choices[0].message.content;

    // PARSING LOGIC
    let replyText = raw_output;
    const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
    if (chatMatch) {
        replyText = chatMatch[1].trim();
    } else {
        replyText = raw_output
            .replace(/\[BLUEPRINT_START\][\s\S]*?\[BLUEPRINT_END\]/g, "")
            .replace(/\[VISION_PROMPT:.*?\]/g, "")
            .trim();
    }

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
    return new Response(JSON.stringify({ error: error.message }), { 
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});