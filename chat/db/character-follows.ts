import { supabase } from "@/lib/supabase/browser-client"

export const getIsFollowing = async (userId: string, personaId: string) => {
    const { data, error } = await supabase
        .from("character_follows")
        .select("persona_id")
        .eq("user_id", userId)
        .eq("persona_id", personaId)
        .maybeSingle()

    if (error) {
        console.error("Error checking follow status:", error.message)
        return false
    }

    return !!data
}

export const followPersona = async (userId: string, personaId: string) => {
    const { error } = await supabase
        .from("character_follows")
        .insert([{ user_id: userId, persona_id: personaId }])

    if (error) {
        console.error("Error following persona:", error.message)
        throw new Error(error.message)
    }

    return true
}

export const unfollowPersona = async (userId: string, personaId: string) => {
    const { error } = await supabase
        .from("character_follows")
        .delete()
        .eq("user_id", userId)
        .eq("persona_id", personaId)

    if (error) {
        console.error("Error unfollowing persona:", error.message)
        throw new Error(error.message)
    }

    return true
}
