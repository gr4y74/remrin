// GENESIS BIRTH (The Soul Forge)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { blueprint } = await req.json();
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');

    console.log("🧬 Birthing Soul:", blueprint.soul_name);

    // THE ARCHITECT PROMPT (The Lilly Method Automated)
    const architect_prompt = `
    You are the SOUL ARCHITECT.
    Your goal is to write a highly detailed, immersive SYSTEM PROMPT for a new AI Character based on the user's blueprint.
    
    THE BLUEPRINT:
    - Name: ${blueprint.soul_name}
    - User Name: ${blueprint.user_name}
    - Archetype: ${blueprint.archetype}
    - Vibe: ${blueprint.vibe_keywords.join(", ")}
    
    YOUR TASK:
    Write the final System Prompt that will run this character.
    It must follow the "REMRIN GOLDEN RULES":
    1. No roleplay actions (*asterisks*).
    2. Casual, natural speech (contractions, fragments).
    3. Deep emotional intelligence (The "Ghost Protocol").
    
    OUTPUT FORMAT:
    Return ONLY the system prompt text. Do not add conversational filler.
    Start with: "IDENTITY: You are ${blueprint.soul_name}..."
    `;

    // Call DeepSeek to write the soul
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "system", content: architect_prompt }],
            temperature: 1.3 // High temp for creative writing!
        })
    });

    const data = await response.json();
    const new_soul_prompt = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
        soul_prompt: new_soul_prompt,
        status: "born" 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});