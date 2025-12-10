// GENESIS VOICE v1.0 (The Larynx)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// GENESIS VOICE v1.1 (Syntax Fixed)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    const ELEVEN_LABS_KEY = Deno.env.get('ELEVEN_LABS_API_KEY');
    const VOICE_ID = "COjLEgrmZdIQ28VOyOCx"; // Your New Rem ID

    if (!ELEVEN_LABS_KEY) {
      throw new Error("Server Config: ElevenLabs Key Missing");
    }

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
          model_id: "eleven_monolingual_v1", // Standard Model
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs Error: ${err}`);
    }

    const audioBlob = await response.blob();
    return new Response(audioBlob, {
      headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
    });

  } catch (error) {
    console.error("🔥 VOICE CRASH:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});