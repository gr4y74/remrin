// grab-samples.ts
import https from "https";
import fs from "fs";
import path from "path";

// No API key needed!

const MODELS = {
    image: [
        { id: "black-forest-labs/flux-1.1-pro", name: "Flux 1.1 Pro" },
        { id: "black-forest-labs/flux-pro", name: "Flux Pro" },
        { id: "black-forest-labs/flux-dev", name: "Flux Dev" },
        { id: "black-forest-labs/flux-schnell", name: "Flux Schnell" },
        { id: "recraft-ai/recraft-v3", name: "Recraft V3" },
        { id: "ideogram-ai/ideogram-v2", name: "Ideogram V2" },
        { id: "fofr/sticker-maker", name: "Sticker Maker" },
        { id: "playgroundai/playground-v2.5", name: "Playground V2.5" },
        { id: "stability-ai/sdxl", name: "SDXL" },
        { id: "bytedance/sdxl-lightning-4step", name: "SDXL Lightning" }
    ],
    video: [
        { id: "minimax/video-01", name: "Minimax Video-01" },
        { id: "genmo/mochi-1-preview", name: "Mochi 1 Preview" },
        { id: "tencent/hunyuan-video", name: "Hunyuan Video" },
        { id: "lightricks/ltx-video", name: "LTX Video" },
        { id: "fofr/cogvideox-5b", name: "CogVideoX 5B" },
        { id: "stability-ai/stable-video-diffusion", name: "Stable Video Diffusion" },
        { id: "lucataco/animate-diff", name: "Animate Diff" },
        { id: "deforum/deforum_stable_diffusion", name: "Deforum" },
        { id: "cjwbw/zeroscope-v2-xl", name: "Zeroscope V2 XL" },
        { id: "fofr/live-portrait", name: "Live Portrait" }
    ],
    edit: [
        { id: "stability-ai/stable-diffusion-inpainting", name: "SD Inpainting" },
        { id: "fofr/face-to-sticker", name: "Face to Sticker" },
        { id: "fofr/become-image", name: "Become Image" },
        { id: "sczhou/codeformer", name: "CodeFormer" },
        { id: "tencentarc/gfpgan", name: "GFPGAN" },
        { id: "nightmareai/real-esrgan", name: "Real-ESRGAN" },
        { id: "fofr/remove-bg", name: "Remove BG" },
        { id: "fofr/controlnet", name: "ControlNet" },
        { id: "rosebud-ai/clip-interrogator", name: "CLIP Interrogator" },
        { id: "fofr/image-blend", name: "Image Blend" }
    ]
};

// Download file
const downloadFile = (url: string, filepath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const request = https.get(url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location!, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }
        });

        request.on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

// Fetch model page HTML and extract image URL
async function scrapeModelExample(modelId: string): Promise<string | null> {
    return new Promise((resolve) => {
        const url = `https://replicate.com/${modelId}`;

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        }, (response) => {
            let html = '';

            response.on('data', (chunk) => {
                html += chunk;
            });

            response.on('end', () => {
                // Look for example output images in the HTML
                // Replicate typically uses replicate.delivery CDN
                const imageMatch = html.match(/https:\/\/replicate\.delivery\/[^"'\s]+\.(png|jpg|jpeg|webp|mp4)/i);

                if (imageMatch) {
                    resolve(imageMatch[0]);
                } else {
                    // Fallback: look for any CDN image
                    const cdnMatch = html.match(/https:\/\/[^"'\s]*replicate[^"'\s]*\.(png|jpg|jpeg|webp|mp4)/i);
                    resolve(cdnMatch ? cdnMatch[0] : null);
                }
            });
        }).on('error', () => {
            resolve(null);
        });
    });
}

// Main function
async function grabAllSamples() {
    console.log("🎨 Starting FREE sample collection...\n");

    const results: any = {
        image: [],
        video: [],
        edit: []
    };

    for (const [category, modelList] of Object.entries(MODELS)) {
        console.log(`\n📁 Processing ${category.toUpperCase()} models...`);

        for (const model of modelList) {
            try {
                console.log(`  🔍 Scraping: ${model.name}`);

                const sampleUrl = await scrapeModelExample(model.id);

                if (!sampleUrl) {
                    console.log(`  ⚠️  No sample found for ${model.name}`);
                    continue;
                }

                // Determine file extension
                const extension = sampleUrl.match(/\.(png|jpg|jpeg|webp|mp4)$/i)?.[0] ||
                    (category === 'video' ? '.mp4' : '.png');

                // Create safe filename
                const safeModelName = model.id.replace(/\//g, "_");
                const outputDir = `./samples/${category}`;

                // Create directory
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const filepath = path.join(outputDir, `${safeModelName}${extension}`);

                // Download
                await downloadFile(sampleUrl, filepath);

                console.log(`  ✅ Downloaded: ${model.name}`);

                results[category].push({
                    model_id: model.id,
                    display_name: model.name,
                    sample_url: sampleUrl,
                    local_path: filepath
                });

                // Be nice to their servers
                await new Promise(r => setTimeout(r, 2000));

            } catch (error: any) {
                console.log(`  ❌ Failed: ${model.name} - ${error.message}`);
            }
        }
    }

    // Save metadata
    fs.writeFileSync(
        "./samples/metadata.json",
        JSON.stringify(results, null, 2)
    );

    console.log("\n✨ Complete!");
    console.log(`📊 Collected: ${results.image.length} images, ${results.video.length} videos, ${results.edit.length} edits`);
    console.log(`💾 Saved to: ./samples/`);
    console.log(`💰 Cost: $0.00 (FREE!)`);
}

grabAllSamples();
