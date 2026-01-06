import { supabase } from "@/lib/supabase/browser-client"

export const getSimilarPersonas = async (personaId: string, limit = 5) => {
    // 1. Get current persona's hashtags and category
    const { data: currentPersona, error: fetchError } = await supabase
        .from("personas")
        .select("config, category")
        .eq("id", personaId)
        .single()

    if (fetchError || !currentPersona) return []

    const hashtags = currentPersona.config?.hashtags || []
    const category = currentPersona.category

    // 2. Query for personas with similar hashtags or same category
    let query = supabase
        .from("personas")
        .select("*")
        .neq("id", personaId)
        .eq("visibility", "PUBLIC")

    if (hashtags.length > 0) {
        // Search by any of the hashtags
        query = query.filter("config->hashtags", "cs", JSON.stringify(hashtags.slice(0, 3)))
    } else if (category) {
        query = query.eq("category", category)
    }

    const { data, error } = await query.limit(limit)

    if (error) {
        console.error("Error fetching similar personas:", error.message)
        return []
    }

    // If we didn't find enough, fetch random public ones
    if (data.length < limit) {
        const { data: randomData } = await supabase
            .from("personas")
            .select("*")
            .neq("id", personaId)
            .eq("visibility", "PUBLIC")
            .limit(limit - data.length)

        return [...data, ...(randomData || [])]
    }

    return data
}
