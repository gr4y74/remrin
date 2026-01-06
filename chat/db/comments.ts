import { supabase } from "@/lib/supabase/browser-client"

export const getCommentsByPersonaId = async (personaId: string) => {
    const { data, error } = await supabase
        .from("persona_comments")
        .select(`
      *,
      profiles (
        username,
        image_url,
        display_name
      )
    `)
        .eq("persona_id", personaId)
        .order("created_at", { ascending: false })

    if (error) {
        console.error("Error fetching persona comments:", error.message)
        return []
    }

    return data
}

export const postComment = async (userId: string, personaId: string, text: string) => {
    const { data, error } = await supabase
        .from("persona_comments")
        .insert([{
            user_id: userId,
            persona_id: personaId,
            comment_text: text
        }])
        .select("*")
        .single()

    if (error) {
        console.error("Error posting persona comment:", error.message)
        throw new Error(error.message)
    }

    return data
}
