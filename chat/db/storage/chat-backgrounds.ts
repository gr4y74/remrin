import { supabase } from "@/lib/supabase/browser-client"

export const uploadChatBackground = async (
    path: string,
    image: File
) => {
    const bucket = "chat_backgrounds"

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, image, {
            upsert: true
        })

    if (!data) {
        throw new Error(error.message)
    }

    return data.path
}

export const getChatBackgroundFromStorage = async (path: string) => {
    const bucket = "chat_backgrounds"

    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(
        path,
        60 * 60 * 24 // 24 hours
    )

    if (!data) {
        throw new Error(error?.message || "Failed to get background URL")
    }

    return data.signedUrl
}

export const deleteChatBackground = async (path: string) => {
    const bucket = "chat_backgrounds"

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
        throw new Error(error.message)
    }
}
