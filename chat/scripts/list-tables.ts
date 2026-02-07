
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log("🔍 Listing tables in public schema...");

    // A common trick to list tables via Postgrest if you don't have RPC
    const { data, error } = await supabase.from('not_a_table').select('*').limit(1);

    if (error) {
        console.log("Error details:", JSON.stringify(error, null, 2));
        if (error.message.includes("Perhaps you meant")) {
            console.log("💡 FOUND HINT:", error.message);
        }
    }

    // Try to query 'models' directly
    const { data: modelsData, error: modelsError } = await supabase.from('models').select('*').limit(5);
    if (!modelsError) {
        console.log("✅ 'models' table exists!");
        console.log("Sample data:", JSON.stringify(modelsData, null, 2));
    } else {
        console.log("❌ 'models' table NOT found.");
    }

    // Try to query 'ai_models' again
    const { data: aiModelsData, error: aiModelsError } = await supabase.from('ai_models').select('*').limit(5);
    if (!aiModelsError) {
        console.log("✅ 'ai_models' table exists!");
    } else {
        console.log("❌ 'ai_models' table NOT found.");
    }
}

listTables();
