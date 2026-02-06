import { supabase } from "@/lib/supabase/browser-client"

// Fetch all personas owned by a specific user
export const getPersonasByOwnerId = async (ownerId: string) => {
    const { data: personas, error } = await supabase
        .from("personas")
        .select("*")
        .eq("creator_id", ownerId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching personas:", error.message)
        return []
    }

    return personas || []
}

// Fetch all personas in a user's collection (Owned + Followed)
export const getUserCollection = async (userId: string) => {
    // 1. Get Owned
    const { data: owned, error: ownedError } = await supabase
        .from("personas")
        .select("*")
        .eq("creator_id", userId)

    if (ownedError) console.error("Error fetching owned personas:", ownedError.message)

    // 2. Get Followed (Summoned)
    const { data: follows, error: followError } = await supabase
        .from("character_follows")
        .select("persona_id, personas(*)")
        .eq("user_id", userId)

    if (followError) console.error("Error fetching followed personas:", followError.message)

    // 3. Merge and Deduplicate
    const collection = [...(owned || [])]

    // Add followed personas if they aren't already in the list (though unlikely to be both owner and follower, possible)
    follows?.forEach((item: any) => {
        // Only add if persona exists (not deleted) and has valid data
        if (item.personas && item.personas.id && item.personas.name && !collection.find(p => p.id === item.personas.id)) {
            collection.push(item.personas)
        }
    })

    return collection
}

// Fetch a single persona by ID or Slug
export const getPersonaById = async (personaId: string) => {
    // Basic UUID regex
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(personaId)

    const query = supabase
        .from("personas")
        .select("*")

    if (isUUID) {
        query.eq("id", personaId)
    } else {
        // Fallback to name if it's a short identifier
        query.ilike("name", personaId)
    }

    const { data: persona, error } = await query.single()

    if (error) {
        console.warn(`[getPersonaById] Error fetching persona with identifier '${personaId}':`, error.message)
        return null
    }

    return persona
}

// Claim a persona using the RPC function (bypasses RLS)
// The claim_persona function in Supabase handles ownership transfer
export const claimPersona = async (soulId: string) => {
    console.log("🔗 Claiming persona:", soulId)

    // Call the RPC function that has SECURITY DEFINER privileges
    // Note: Using 'as any' because claim_persona is a custom RPC not in generated types
    const { data, error } = await (supabase.rpc as any)('claim_persona', {
        soul_id: soulId
    })

    console.log("🔗 RPC Response - data:", data, "error:", error)

    if (error) {
        console.error("Error claiming persona:", error.message)
        throw new Error(error.message)
    }

    // The RPC returns boolean (true = success)
    // Now fetch the full persona data - it should be ours now
    console.log("🔗 RPC returned:", data, "- fetching persona data...")

    try {
        const persona = await getPersonaById(soulId)
        console.log("🔗 Fetched persona:", persona)
        return persona
    } catch (fetchError: any) {
        console.error("🔗 Failed to fetch persona after claim:", fetchError)
        // The claim might have succeeded but we can't fetch - 
        // Return null and let user refresh the page
        return null
    }
}
