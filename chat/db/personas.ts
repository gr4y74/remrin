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

// Claim a persona using the RPC function (bypasses RLS)
// The claim_persona function in Supabase handles ownership transfer
export const claimPersona = async (soulId: string) => {
    // Call the RPC function that has SECURITY DEFINER privileges
    // Note: Using 'as any' because claim_persona is a custom RPC not in generated types
    const { data, error } = await (supabase.rpc as any)('claim_persona', {
        soul_id: soulId
    })

    if (error) {
        console.error("Error claiming persona:", error.message)
        throw new Error(error.message)
    }

    // If successful, fetch the full persona data to return
    if (data) {
        const persona = await getPersonaById(soulId)
        return persona
    }

    return null
}
