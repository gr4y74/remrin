// GENESIS VOICE v1.0 (The Larynx)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 1. Handle CORS (The Doorman)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    // 2. Get the Keys
    const ELEVEN_LABS_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    // Default Voice ID (Rem's Voice - replace if you have a specific one)
    // This is a default soft female voice ("Rachel"). Change to your preferred ID.
    const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; 

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
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs Error: ${err}`);
    }

    // 4. Send Audio Back (Stream it)
    const audioBlob = await response.blob();
    return new Response(audioBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error("🔥 VOICE CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});