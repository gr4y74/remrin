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
        // This could be an RLS issue. Return a minimal object so UI can at least show something
        return {
            id: soulId,
            name: "Claimed Soul (refresh to see details)",
            owner_id: "claimed",
            created_at: new Date().toISOString()
        }
    }
}
