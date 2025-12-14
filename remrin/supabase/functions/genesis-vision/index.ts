// GENESIS VISION (v24.0 - TAROT EDITION + STABILITY)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const REPLICATE_KEY = Deno.env.get('REPLICATE_API_TOKEN');

    if (!REPLICATE_KEY) throw new Error("Missing Replicate Key");

    // 🔮 THE TAROT WRAPPER (YOUR CUSTOM STYLE PRESERVED)
    // We keep the golden borders and smoke effect you love.
    const tarotPrompt = `A mystical Tarot card design of: ${prompt}. 
    Intricate golden borders, art nouveau style, ethereal lighting, highly detailed, matte finish. 
    Centered composition. The card is emerging from smoke.`;

    console.log("🎨 Generating Tarot Vision for:", prompt);

    // 1. CALL REPLICATE (Using Flux-Schnell for Speed & Stability)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${REPLICATE_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            // We use 'schnell' because it is much faster for onboarding and less likely to timeout
            version: "f286377317781b457849206d447477610191599520443d3d63467406a4452174", 
            input: {
                prompt: tarotPrompt, // <--- Your custom style
                aspect_ratio: "2:3", // <--- Your custom shape
                output_format: "png",
                safety_tolerance: 5  // Allow creative freedom
            }
        })
    });

    const prediction = await response.json();

    if (prediction.error) throw new Error(prediction.error);
    if (!prediction.urls || !prediction.urls.get) throw new Error("Invalid API Response from Replicate");

    // 2. POLL FOR COMPLETION
    let imageUrl = null;
    let statusUrl = prediction.urls.get;
    let status = "starting";

    // Loop for max 30 seconds
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        
        const statusReq = await fetch(statusUrl, {
            headers: { "Authorization": `Token ${REPLICATE_KEY}` }
        });
        const statusData = await statusReq.json();
        status = statusData.status;

        if (status === "succeeded") {
            imageUrl = statusData.output;
            if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];
            break; 
        } else if (status === "failed") {
            throw new Error("Generation Failed at Replicate");
        }
    }

    if (!imageUrl) throw new Error("Timeout waiting for image");

    console.log("✅ Vision Generated:", imageUrl);

    return new Response(JSON.stringify({ 
        image_url: imageUrl 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("🔥 Vision Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});