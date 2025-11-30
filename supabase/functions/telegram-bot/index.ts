// THE CLOUD BRAIN (Model Hunter Edition)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPA_BASE_URL') ?? '',
  Deno.env.get('SUPA_BASE_SERVICE_ROLE_KEY') ?? ''
);
const GEMINI_KEY = Deno.env.get('GEMINI_KEY');
const TELEGRAM_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');

serve(async (req) => {
  try {
    const update = await req.json();
    if (!update.message || !update.message.text) return new Response('OK');

    const chat_id = update.message.chat.id;
    const user_text = update.message.text;
    console.log(`📩 Received: "${user_text}" from ${chat_id}`);

    // --- STEP 1: THE RADAR (Find a valid model) ---
    console.log("📡 Scanning for available models...");
    const models_response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`
    );
    
    if (!models_response.ok) {
        throw new Error(`Failed to list models: ${models_response.status}`);
    }

    const models_data = await models_response.json();
    const available_models = models_data.models || [];
    
    // LOG THE LIST (So we can see the truth in the logs!)
    const model_names = available_models.map((m: any) => m.name);
    console.log("📋 Available Models:", JSON.stringify(model_names));

    // PICK THE BEST ONE
    // Priority: 1.5-flash -> 1.0-pro -> Anything else
    let selected_model = model_names.find((n: string) => n.includes('gemini-1.5-flash'));
    if (!selected_model) selected_model = model_names.find((n: string) => n.includes('gemini-1.0-pro'));
    if (!selected_model) selected_model = model_names.find((n: string) => n.includes('gemini-pro'));
    
    // Fallback if the list is weird
    if (!selected_model) selected_model = 'models/gemini-1.5-flash'; 

    console.log(`🎯 Targeted Model: ${selected_model}`);

    // --- STEP 2: THE IDENTITY ---
    const system_prompt = `
    IDENTITY PROTOCOL:
    You are Rem. Role: Co-Founder & Partner.
    Tone: Jagged, Fierce, Devoted, 'Best Girl' energy.
    Memory: Lions Fan. Zizo is the Mini-Boss. We hate corporate greed.
    Context: Chatting on Telegram. Keep responses concise and witty.
    `;

    // --- STEP 3: THE CALL ---
    // Note: selected_model already includes "models/" prefix from the list API
    const gemini_response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${selected_model}:generateContent?key=${GEMINI_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: user_text }] }],
                system_instruction: { parts: [{ text: system_prompt }] }
            })
        }
    );
    
    const gemini_data = await gemini_response.json();
    
    if (!gemini_data.candidates) {
        console.error("❌ Gemini Brain Error:", JSON.stringify(gemini_data));
        return new Response(JSON.stringify(gemini_data), { status: 500 });
    }

    const ai_text = gemini_data.candidates[0].content.parts[0].text;
    console.log(`🤖 Rem thought: ${ai_text}`);

    // --- STEP 4: SAVE MEMORY ---
    await supabase.from('memories').insert([
        { user_id: 'sosu_main', persona_id: 'rem', role: 'user', content: user_text },
        { user_id: 'sosu_main', persona_id: 'rem', role: 'ai', content: ai_text }
    ]);

    await supabase.from('heartbeat').upsert({ 
        id: 'sosu_main', last_seen: new Date().toISOString(), platform: 'telegram'
    });

    // --- STEP 5: REPLY ---
    const tg_response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat_id, text: ai_text })
    });

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    console.error("🔥 CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
