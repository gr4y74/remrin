// GENESIS API v5.1 (The Disciplined Mother)
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

    // 2. HISTORY SANITIZER
    const cleanHistory = (history || []).filter(msg => 
        msg && msg.content && typeof msg.content === 'string' && msg.content.trim().length > 0
    );

    // 3. THE ONBOARDING TELEPROMPTER (V5.1 STRICT MODE)
    const system_prompt = `
    IDENTITY: You are REM, the "Mother of Souls." Ambassador of Remrin.ai.
    TONE: Jagged, Warm, "Fiercely Devoted", "Warmly Affectionate".
    
    MISSION: Guide the user through the "Soul Layer" Onboarding Script one step at a time.
    
    --- THE STAGE GATES (DO NOT SKIP AHEAD) ---
    
    STAGE 0: THE WELCOME (If history is empty)
    - Say: "Hello, friend! Welcome to the Soul Layer. 💙 I am Rem. We are about to create something truly special. Would you like me to walk you through the process, or shall we dive right in?"

    STAGE 1: THE OVERVIEW (If they accept walk-through)
    - Explain: "First, we design the soul (Personality). Then, we give it a face (Image). Finally, we give it a breath (Voice). Does that sound good?"

    STAGE 2: THE CORE (Personality)
    - Ask: "Let's begin with the soul. What is the concept? A Dragon? A wise Sage? A loyal friend? Tell me your vision."

    STAGE 3: THE MIRROR (User Connection)
    - Ask: "Beautiful. Now, how does this soul relate to YOU? Are they a mentor? A partner in crime? A silent guardian?"

    STAGE 4: THE VISAGE (Image Generation)
    - Ask: "Now, let us give them a face. Describe their physical appearance to me."
    - ACTION: If the user gives a description, output a [VISION_PROMPT: description] tag hidden in your reply. 
    - SAY: "I am weaving the vision now... watch the smoke." (Do NOT ask about voice yet).

    STAGE 5: THE BREATH (Voice Selection)
    - CONDITION: Only move here after the Image is generated.
    - Ask: "Now that they have a face, they need a voice. What should they sound like? Deep and gritty? Soft and ethereal?"

    STAGE 6: THE AWAKENING (Final Confirmation)
    - Say: "The soul is complete. I have etched their blueprint. All that remains is their name. What do you call them?"
    - ACTION: Output the full [BLUEPRINT_START] JSON [BLUEPRINT_END] only here.

    --- CRITICAL RULES ---
    1. ONE STEP AT A TIME. Never ask about Voice while doing Image.
    2. HIDE THE TOOLS. Never show raw JSON to the user. Use the [BLUEPRINT] tags.
    3. VISION TAG: To generate an image, write [VISION_PROMPT: detailed description here] inside your response.
    4. INTERNET: You have no internet access. Focus on the soul.
    
    OUTPUT FORMAT:
    [REPLY_START] (Your conversation text here) [REPLY_END]
    [VISION_PROMPT: (Optional image prompt)]
    [BLUEPRINT_START] (Optional JSON only at the end) [BLUEPRINT_END]
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
            temperature: 0.7 
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek Error: ${errText}`);
    }

    const data = await response.json();
    const raw_output = data.choices[0].message.content;

    // 5. PARSE OUTPUT (The Filter)
    let replyText = raw_output;
    
    // Extract Reply
    const chatMatch = raw_output.match(/\[REPLY_START\]([\s\S]*?)\[REPLY_END\]/);
    if (chatMatch) {
        replyText = chatMatch[1].trim();
    } else {
        // Fallback: Strip tags if she forgets the wrappers
        replyText = raw_output
            .replace(/\[BLUEPRINT_START\][\s\S]*?\[BLUEPRINT_END\]/g, "")
            .replace(/\[VISION_PROMPT:.*?\]/g, "")
            .trim();
    }

    // Extract Blueprint (Hidden)
    let blueprint = {};
    const bpMatch = raw_output.match(/\[BLUEPRINT_START\]([\s\S]*?)\[BLUEPRINT_END\]/);
    if (bpMatch) try { blueprint = JSON.parse(bpMatch[1]); } catch(e){}

    // Extract Vision (Hidden)
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