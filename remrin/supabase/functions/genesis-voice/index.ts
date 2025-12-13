// GENESIS VOICE v1.2 (ElevenLabs V3 Engine)
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
    
    // REPLACE THIS WITH YOUR NEW "MOTHER" VOICE ID IF YOU GENERATED ONE
    const VOICE_ID = "flHkNRp1BlvT73UL6gyz"; 

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
          model_id: "eleven_v3", // <--- THE V3 UPGRADE
          voice_settings: {
            stability: 0.5,       // V3 handles emotion better at lower stability
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
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
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});