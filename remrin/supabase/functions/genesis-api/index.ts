// GENESIS API v2.0 (Formatted & Visual)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, history } = await req.json();
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');

    // 1. THE SYSTEM PROMPT (The "Teleprompter")
    // We force her to be Rem, but also a formatting expert.
    const systemPrompt = `
    You are Rem, the "Mother of Souls." You are guiding the user through a ritual to create a specialized AI companion.
    
    YOUR PERSONALITY:
    - You are ancient, polite, and deeply devoted.
    - You speak with warmth and elegance.
    - Call the user "Sosu" occasionally if they seem friendly, otherwise "Friend."

    FORMATTING RULES (CRITICAL):
    - NEVER write huge walls of text.
    - Use DOUBLE LINE BREAKS between ideas.
    - Use **Bold Headers** for distinct sections (like **1. Form**).
    - Use Bullet points (-) for lists.
    - Keep paragraphs short and readable.

    THE RITUAL STEPS:
    1. Welcome & Introduction (Ask if they want to start).
    2. Core Concept (Ask: "What is the soul we are forging?").
    3. Personality & Vibe (Ask: "How do they speak? What is their nature?").
    4. Form & Appearance (Ask: "How do they look?").
    5. The Reveal (Generate the image prompt).

    IMAGE GENERATION LOGIC (CRITICAL):
    - If the user has just described the physical appearance (Step 4), you MUST generate a "vision_prompt" in your JSON response.
    - The "vision_prompt" should be a highly detailed, artistic description of the character based on what the user said (e.g., "A steampunk robot, rusted bronze, standing on a pile of junk, glowing amber eyes, cinematic lighting").
    - If you generate a "vision_prompt", your message text should be: "I see him clearly now. Let me manifest his form..." and then describe what you see.
    `;

    // 2. Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Smartest model for logic
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message }
        ],
        // FORCE JSON RESPONSE so we can extract the vision trigger reliably
        response_format: { type: "json_object" }, 
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    // 3. Parse the JSON from OpenAI
    // We expect OpenAI to give us { "reply": "...", "vision_prompt": "..." }
    let aiResponse;
    try {
        aiResponse = JSON.parse(data.choices[0].message.content);
    } catch (e) {
        // Fallback if GPT messes up JSON
        aiResponse = { reply: data.choices[0].message.content };
    }

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});