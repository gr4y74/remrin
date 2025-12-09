// GENESIS VOICE (The Uncrashable Larynx)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. IMMEDIATE CORS HANDLING
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice_id } = await req.json();
    
    // 2. SAFE KEY RETRIEVAL
    const EL_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    if (!EL_KEY) {
      throw new Error("CRITICAL: ELEVEN_LABS_API_KEY is missing from Supabase Secrets.");
    }

    const VOICE_ID = voice_id || "21m00Tcm4TlvDq8ikWAM"; // Rem's default ID

    console.log(`🎙️ Voice Request: "${text.substring(0, 20)}..." using ID: ${VOICE_ID}`);

    // 3. CALL ELEVENLABS
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': EL_KEY,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("🔥 ElevenLabs API Error:", errText);
      throw new Error(`ElevenLabs refused: ${errText}`);
    }

    // 4. STREAM BACK
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error("🔥 VOICE FUNCTION CRASH:", error.message);
    // Return a generic JSON error so the frontend doesn't choke
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});