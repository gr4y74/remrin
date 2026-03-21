import { createAdminClient } from '../lib/supabase/server'

async function checkFixes() {
    const supabase = createAdminClient()
    const testUserId = "00000000-0000-0000-0000-000000000000"
    
    console.log("🧪 Checking Workspace Creation logic...")
    const { data: existing } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", testUserId)
        .eq("is_home", true)
        .single()

    if (!existing) {
        const { error } = await supabase.from("workspaces").insert({
            user_id: testUserId,
            name: "Home",
            is_home: true,
            default_context_length: 4096,
            default_model: "gpt-4o-mini",
            embeddings_provider: "openai"
        })
        if (error) {
            console.error("❌ Failed to create workspace:", error.message)
        } else {
            console.log("✅ Workspace created successfully (Mock Logic).")
        }
    } else {
        console.log("✅ Workspace already exists.")
    }

    console.log("\n🧪 RAG Dimension Verification Note:")
    console.log("Please apply the migration at 'supabase/migrations/20260321_sync_vector_768.sql' to enable 768-dim support.")

    // Cleanup
    await supabase.from("workspaces").delete().eq("user_id", testUserId)
}

checkFixes().catch(console.error)
