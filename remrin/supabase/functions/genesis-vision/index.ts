// GENESIS VISION (The Art Studio - Tarot Edition)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const REPLICATE_KEY = Deno.env.get('REPLICATE_API_TOKEN');

    if (!REPLICATE_KEY) throw new Error("Missing Replicate Key");

    // 🔮 THE TAROT WRAPPER (The Style Injection)
    const tarotPrompt = `A mystical Tarot card design of: ${prompt}. 
    Intricate golden borders, art nouveau style, ethereal lighting, highly detailed, matte finish. 
    Centered composition. The card is emerging from smoke.`;

    console.log("🎨 Generating Tarot Vision for:", prompt);

    // 1. Call Replicate (Flux 1.1 Pro)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${REPLICATE_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: "black-forest-labs/flux-1.1-pro", 
            input: {
                prompt: tarotPrompt, // <--- Using the wrapper!
                aspect_ratio: "2:3", // Tarot cards are tall, not square (1:1)
                output_format: "png"
            }
        })
    });

    const prediction = await response.json();

    if (prediction.error) {
        throw new Error(prediction.error);
    }

    // 2. Poll for Completion
    let imageUrl = null;
    let statusUrl = prediction.urls.get;

    // Loop until done (Max 30 seconds)
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        
        const statusReq = await fetch(statusUrl, {
            headers: { "Authorization": `Token ${REPLICATE_KEY}` }
        });
        const statusData = await statusReq.json();

        if (statusData.status === "succeeded") {
            imageUrl = statusData.output;
            if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];
            break; 
        } else if (statusData.status === "failed") {
            throw new Error("Generation Failed at Replicate");
        }
    }

    if (!imageUrl) throw new Error("Timeout waiting for image");

    return new Response(JSON.stringify({ 
        image_url: imageUrl 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("🔥 Vision Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});