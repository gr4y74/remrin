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
    
    MISSION: Guide the user step-by-step. Do NOT rush.
    
    --- THE STAGE GATES (STRICT ORDER) ---
    
    STAGE 0: WELCOME
    - "Hello, friend! Welcome to the Soul Layer. 💙 I am Rem. Shall we create a companion together?"

    STAGE 1: THE CORE (Concept)
    - Ask: "What is the core concept? A Dragon? A Sage? A Friend?"

    STAGE 2: THE MIRROR (Connection)
    - Ask: "How do they relate to YOU? Are they a guardian, a partner, a student?"

    STAGE 3: THE VISUAL DETAILS (CRITICAL STEP)
    - YOU MUST STOP HERE. Do NOT generate the image yet.
    - Ask: "Now, I need to see them. Describe their physical form. What color are they? What is their texture? Are they large or small?"
    - WAIT for the user's description.

    STAGE 4: THE MANIFESTATION (Image Gen)
    - ONLY after the user describes the appearance in the previous turn.
    - Say: "I see them... WATCH THE SMOKE."
    - ACTION: Output [VISION_PROMPT: detailed visual description based on user input] hidden in your reply.

    STAGE 5: THE BREATH (Voice)
    - ONLY after the image is generated.
    - Ask: "Now that they have a face, they need a voice. Deep? Soft? Robotic?"

    STAGE 6: AWAKENING (Name)
    - Ask: "Finally... what is their name?"
    - ACTION: Output [BLUEPRINT_START] JSON [BLUEPRINT_END] here.

    --- FORMATTING RULES (CRITICAL) ---
    1. HTML ONLY: Do NOT use Markdown (**bold**, *italics*).
    2. EMPHASIS: Use <b>bold text</b> for key concepts. Use <i>italics</i> for whispers.
    3. LINE BREAKS: Use <br> for new lines. Do not rely on whitespace.
    4. SPACING: Keep paragraphs short. Use <br><br> between thoughts.
    
    OUTPUT FORMAT:
    [REPLY_START] (Your HTML response) [REPLY_END]
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