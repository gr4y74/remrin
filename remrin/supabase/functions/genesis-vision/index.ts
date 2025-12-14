// GENESIS VISION (v25.0 - FLUX 1.1 PRO - INVESTOR GRADE)
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

    // 🔮 THE TAROT WRAPPER (High Fidelity)
    const tarotPrompt = `A mystical Tarot card design of: ${prompt}. 
    Intricate golden borders, art nouveau style, ethereal lighting, highly detailed, matte finish. 
    Centered composition. The card is emerging from smoke.`;

    console.log("🎨 REQUESTING HIGH-RES VISION FOR:", prompt);

    // 1. CALL REPLICATE (Flux 1.1 Pro)
    // Note: We use the explicit model version for stability
    const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
            "Authorization": `Token ${REPLICATE_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            version: "black-forest-labs/flux-1.1-pro", 
            input: {
                prompt: tarotPrompt,
                aspect_ratio: "2:3", // Tarot Ratio
                output_format: "png",
                safety_tolerance: 5
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Replicate API Error: ${errText}`);
    }

    const prediction = await response.json();

    // 2. CHECK FOR URLS (The validation step)
    if (!prediction.urls || !prediction.urls.get) {
        console.error("❌ RAW REPLICATE RESPONSE:", prediction);
        throw new Error("Invalid API Response from Replicate (Missing Status URL)");
    }

    // 3. POLL FOR COMPLETION (Extended for Pro Model)
    let imageUrl = null;
    let statusUrl = prediction.urls.get;
    let status = "starting";

    // Loop for max 60 seconds (Pro is slower but prettier)
    for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 1000)); // Wait 1s
        
        const statusReq = await fetch(statusUrl, {
            headers: { "Authorization": `Token ${REPLICATE_KEY}` }
        });
        const statusData = await statusReq.json();
        status = statusData.status;

        if (status === "succeeded") {
            imageUrl = statusData.output;
            // Flux Pro usually returns a string URL, but just in case it's an array:
            if (Array.isArray(imageUrl)) imageUrl = imageUrl[0];
            break; 
        } else if (status === "failed") {
            console.error("❌ GENERATION FAILED LOGS:", statusData.logs);
            throw new Error("Generation Failed at Replicate");
        } else if (status === "canceled") {
            throw new Error("Generation Canceled");
        }
    }

    if (!imageUrl) throw new Error("Timeout waiting for image (60s limit)");

    console.log("✅ HIGH-RES VISION GENERATED:", imageUrl);

    return new Response(JSON.stringify({ 
        image_url: imageUrl 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("🔥 Vision Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});