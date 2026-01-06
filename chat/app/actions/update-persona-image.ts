'use server'

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { uploadSoulPortrait } from "@/db/storage/soul-portraits"

export async function updatePersonaImageActions(formData: FormData) {
    try {
        const file = formData.get('file') as File
        const personaId = formData.get('personaId') as string

        if (!file || !personaId) {
            return { error: "Missing file or persona ID" }
        }

        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: "Unauthorized" }
        }

        // Verify ownership
        const { data: persona } = await supabase
            .from('personas')
            .select('owner_id')
            .eq('id', personaId)
            .single()

        if (!persona || persona.owner_id !== user.id) {
            return { error: "You do not have permission to edit this character" }
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload using the existing utility
        // We use a prefix to distinguish manual uploads if needed, but standard path is fine
        const result = await uploadSoulPortrait(buffer, user.id, `manual_${personaId}_${Date.now()}`)

        // Update persona record
        const { error: updateError } = await supabase
            .from('personas')
            .update({ image_url: result.url })
            .eq('id', personaId)

        if (updateError) {
            return { error: "Failed to update persona record" }
        }

        return { success: true, url: result.url }

    } catch (error: any) {
        console.error("Update image error:", error)
        return { error: error.message || "An unexpected error occurred" }
    }
}
