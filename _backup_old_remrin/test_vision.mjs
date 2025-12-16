import dotenv from 'dotenv';
dotenv.config();

const REPLICATE_KEY = process.env.REPLICATE_API_TOKEN;

if (!REPLICATE_KEY) {
    console.error("❌ MISSING REPLICATE KEY! Check your .env file.");
    process.exit(1);
}

console.log("🎨 Initializing The Studio (Flux-Schnell)...");

async function generateVision() {
    const prompt = "A cute pink dragon with butterfly wings, eating a cupcake, cinematic lighting, 3d render, pixar style, 4k";

    try {
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${REPLICATE_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "black-forest-labs/flux-1.1-pro",
                // Try one of these version IDs instead: "black-forest-labs/flux-1.1-pro"  // or check their latest versions "stability-ai/stable-diffusion"   // alternative model
                input: {
                    prompt: prompt,
                    aspect_ratio: "1:1",
                    output_format: "png",
                    go_fast: true
                }
            })
        });

        // DEBUG: Print the raw status
        console.log(`📡 API Status: ${response.status} ${response.statusText}`);

        const prediction = await response.json();
        
        // DEBUG: Print the FULL response so we see the error message
        console.log("📦 API Response:", JSON.stringify(prediction, null, 2));

        if (response.status !== 201) {
            console.error("❌ STOPPING: API returned an error.");
            return;
        }

        if (prediction.error) {
            console.error("🔥 Replicate Error:", prediction.error);
            return;
        }

        console.log(`⏳ Generation started... ID: ${prediction.id}`);
        console.log(`👀 Check status at: ${prediction.urls.get}`);

        // Replicate is async, we have to wait a second for the image
        await checkStatus(prediction.urls.get);

    } catch (e) {
        console.error("🔥 Network Error:", e);
    }
}

async function checkStatus(url) {
    // Poll every 1 second until done
    const response = await fetch(url, {
        headers: { "Authorization": `Token ${REPLICATE_KEY}` }
    });
    const status = await response.json();

    if (status.status === "succeeded") {
        console.log("\n✨ VISION COMPLETE!");
        console.log("📸 Image URL:", status.output[0]); // <--- THIS IS THE IMAGE!
    } else if (status.status === "failed") {
        console.error("❌ Generation Failed.");
    } else {
        process.stdout.write("."); // Loading dots
        setTimeout(() => checkStatus(url), 1000);
    }
}

generateVision();