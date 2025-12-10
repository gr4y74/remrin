import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    // 2. Get Secrets & Config
    const ELEVEN_LABS_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    const VOICE_ID = "COjLEgrmZdIQ28VOyOCx"; // Rem's new voice

    if (!ELEVEN_LABS_KEY) {
      throw new Error("Server Config: ElevenLabs Key Missing");
    }

    // 3. Call ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_KEY,
        },
        body: JSON.stringify({
          text: text,
          // SWITCH TO THE HIGH-QUALITY ENGINE (Slower, deeper, better)
          model_id: "eleven_multilingual_v2", 
          
          voice_settings: {
            // INCREASE STABILITY (0.5 -> 0.8) 
            // This prevents the "Helium/Warping" effect.
            stability: 0.8, 
            
            // REDUCE BOOST (0.75 -> 0.5)
            // Too much boost causes static/artifacts.
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs Error: ${err}`);
    }

    // 4. Return Audio
    const audioBlob = await response.blob();
    return new Response(audioBlob, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error("🔥 VOICE CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});