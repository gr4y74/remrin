import { SupabaseClient } from "@supabase/supabase-js"

/**
 * Ensures a user has a default 'Home' workspace.
 * If not found, creates one using the best available model configuration.
 */
export async function ensureHomeWorkspace(supabase: SupabaseClient, userId: string) {
    // 1. Check if Home Workspace exists
    console.log(`[Workspace] Checking for home workspace for user ${userId}...`)

    const { data: homeWorkspace, error: checkError } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", userId)
        .eq("is_home", true)
        .maybeSingle()

    if (homeWorkspace) {
        console.log(`[Workspace] Found existing home workspace: ${homeWorkspace.id} (${homeWorkspace.name})`)
        return homeWorkspace
    }

    if (checkError) {
        console.warn(`[Workspace] Error checking home workspace: ${JSON.stringify(checkError)}`)
    }

    console.log(`[Workspace] No home workspace found. Creating one...`)

    // 2. Fetch highest priority model from config
    const { data: defaultConfig } = await supabase
        .from("llm_config")
        .select("model_id")
        .order("priority", { ascending: false })
        .limit(1)
        .maybeSingle()

    const defaultModel = defaultConfig?.model_id || "gpt-4o-mini"
    console.log(`[Workspace] Using default model: ${defaultModel}`)

    // 3. Create default home workspace
    const { data: newWorkspace, error } = await supabase
        .from("workspaces")
        .insert({
            user_id: userId,
            name: "Home",
            is_home: true,
            default_context_length: 4096,
            default_model: defaultModel,
            embeddings_provider: "openai"
        })
        .select()
        .single()

    if (error) {
        console.error("[Workspace] Failed to create default home workspace:", error)
        throw new Error(`Failed to initialize your home workspace: ${error.message}`)
    }

    console.log(`[Workspace] Successfully created home workspace: ${newWorkspace.id}`)
    return newWorkspace
}
