import { supabase } from "@/lib/supabase/browser-client"

// Fetch all personas owned by a specific user
export const getPersonasByOwnerId = async (ownerId: string) => {
    const { data: personas, error } = await supabase
        .from("personas")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching personas:", error.message)
        return []
    }

    return personas || []
}

// Fetch a single persona by ID
export const getPersonaById = async (personaId: string) => {
    const { data: persona, error } = await supabase
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .single()

    if (error) {
        throw new Error(error.message)
    }

    return persona
}
