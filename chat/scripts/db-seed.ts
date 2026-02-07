
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedModels() {
    console.log("🚀 Starting database/schema verification...");

    // Try to check if table exists by querying it
    const { error: checkError } = await supabase.from('ai_models').select('id').limit(1);

    if (checkError && (checkError.code === 'PGRST116' || checkError.message.includes('ai_models'))) {
        console.log("📝 Table 'ai_models' not found. Creating it via RPC if possible, or suggesting migration...");
        // In a real environment with limited tools, we might need to use the SQL editor or a more robust migration tool.
        // However, I can try to run the SQL from the migration file via a custom script if I have Postgres access or use a hack.

        // Check if we can run raw SQL via RPC (common in some Supabase setups but often disabled)
        // For now, let's assume we can't and try to figure out why psql failed.
    }

    const metadataPath = path.join(process.cwd(), "samples/metadata.json");
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));

    const modelsToInsert: any[] = [];

    for (const [type, modelList] of Object.entries(metadata)) {
        (modelList as any[]).forEach((model: any) => {
            let tier = "HD";
            const highTier = ["flux-1.1", "flux-pro", "flux-dev", "video-01", "hunyuan", "ltx", "controlnet"];
            if (highTier.some(t => model.model_id.includes(t))) {
                tier = model.model_id.includes("1.1-pro") ? "Super Genius" : "Genius";
            }

            let cost = 10;
            if (type === 'video') cost = tier === 'Super Genius' ? 100 : 75;
            if (type === 'edit') cost = tier === 'Super Genius' ? 25 : 15;
            if (type === 'image') {
                if (tier === 'Super Genius') cost = 50;
                else if (tier === 'Genius') cost = 25;
                else cost = 5;
            }

            const safeName = model.model_id.replace(/\//g, "-");
            const localThumbnail = "/" + model.local_path.replace("samples/", "samples/ai-studio/");

            modelsToInsert.push({
                name: safeName,
                model_id: model.model_id,
                type: type,
                display_name: model.display_name,
                description: `Quality tier: ${tier}. powered by ${model.model_id.split('/')[0]}.`,
                aether_cost: cost,
                quality_tier: tier,
                thumbnail_url: localThumbnail,
                is_active: true
            });
        });
    }

    console.log(`📦 Upserting ${modelsToInsert.length} models into 'ai_models'...`);

    const { error } = await supabase
        .from('ai_models')
        .upsert(modelsToInsert, { onConflict: 'name' });

    if (error) {
        console.error("❌ Error upserting models:", error);

        console.log("💡 Hint: If the table doesn't exist, I'll try to find an existing table to use or check the migration status.");
        const { data: tables, error: tableError } = await supabase.rpc('get_tables'); // Long shot
        if (tableError) console.log("Could not list tables via RPC.");
    } else {
        console.log("✅ Database seed complete!");
    }
}

seedModels();
