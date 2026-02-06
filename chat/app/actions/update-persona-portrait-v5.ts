'use server'

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

/**
 * New Persona Portrait Update Action (v5)
 * Distinct name to force Next.js to bypass any old cache/recompilation issues.
 */
export async function updatePersonaPortraitV5Action(formData: FormData) {
    console.log("🚀 [ServerActionV5] updatePersonaPortraitV5Action called", {
        personaId: formData.get('personaId'),
        type: formData.get('type')
    })

    try {
        const file = formData.get('file') as File
        const personaId = formData.get('personaId') as string
        const type = (formData.get('type') as string) || 'avatar'

        if (!file || !personaId) {
            return { error: "V5: Missing file or persona ID" }
        }

        const cookieStore = cookies()
        const supabase = createClient(cookieStore)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: "V5: Unauthorized" }
        }

        // Verify ownership
        const { data: persona } = await supabase
            .from('personas')
            .select('creator_id')
            .eq('id', personaId)
            .single()

        if (!persona || persona.creator_id !== user.id) {
            return { error: "V5: You do not have permission to edit this character" }
        }

        // Determine bucket
        const bucketName = type === 'hero' ? 'persona_hero_images' : 'persona_images'
        const fileExt = file.name.split('.').pop() || 'png'
        const fileName = `${personaId}_${Date.now()}.${fileExt}`

        console.log(`📡 [ServerActionV5] Uploading to bucket: ${bucketName}, path: ${fileName}`)

        // Upload directly to the new buckets
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) {
            console.error("❌ [ServerActionV5] Storage upload error:", uploadError)
            return { error: `V5_STORAGE_ERROR: ${uploadError.message}` }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName)

        // Update persona record
        const updateData: any = {}
        if (type === 'hero') {
            updateData.hero_image_url = publicUrl
        } else {
            updateData.image_url = publicUrl
        }

        const { error: updateError } = await supabase
            .from('personas')
            .update(updateData)
            .eq('id', personaId)

        if (updateError) {
            console.error("❌ [ServerActionV5] DB Update error:", updateError)
            return { error: "V5: Failed to update persona record" }
        }

        console.log(`✅ [ServerActionV5] Successfully updated persona ${type} image`)
        return { success: true, url: publicUrl }

    } catch (error: any) {
        console.error("💥 [ServerActionV5] Unexpected error:", error)
        return { error: `V5_EXCEPTION: ${error.message || "An unexpected error occurred"}` }
    }
}
