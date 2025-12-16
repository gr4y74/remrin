// GENESIS BIRTH (The Soul Forge + The Vault)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { blueprint } = await req.json();
    
    // Init Clients
    const DEEPSEEK_KEY = Deno.env.get('DEEPSEEK_API_KEY');
    const SUPA_URL = Deno.env.get('SUPA_BASE_URL') ?? '';
    const SUPA_KEY = Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(SUPA_URL, SUPA_KEY);

    console.log("🧬 Birthing Soul:", blueprint.soul_name);

    // 1. THE ARCHITECT PROMPT (Write the Soul)
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
    Return ONLY the system prompt text. Start with: "IDENTITY: You are ${blueprint.soul_name}..."
    `;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_KEY}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [{ role: "system", content: architect_prompt }],
            temperature: 1.3
        })
    });

    const data = await response.json();
    const new_soul_prompt = data.choices[0].message.content;

    // 2. THE VAULT (Save to Database)
    const { error: dbError } = await supabase
        .from('souls')
        .insert([
            {
                name: blueprint.soul_name,
                archetype: blueprint.archetype,
                vibe_keywords: blueprint.vibe_keywords,
                system_prompt: new_soul_prompt,
                blueprint: blueprint,
                // We default user to 'guest' for now until Auth is live
                user_id: 'guest' 
            }
        ]);

    if (dbError) {
        console.error("DB Save Failed:", dbError);
        // We don't crash, we still return the prompt to the user
    } else {
        console.log("💾 Soul Saved to Vault!");
    }

    // 3. Return to User
    return new Response(JSON.stringify({ 
        soul_prompt: new_soul_prompt,
        status: "born" 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});