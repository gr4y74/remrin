/**
 * Soul Portrait Storage Utilities
 * 
 * Handles uploading generated portrait images to Supabase storage.
 * Following patterns from existing storage utilities.
 */

import { createClient } from "@supabase/supabase-js"

// Use service role for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = "soul_portraits"
const MAX_IMAGE_SIZE = 10000000 // 10MB

export interface UploadResult {
    path: string
    url: string
}

/**
 * Upload a generated portrait image to Supabase storage
 * 
 * @param imageBuffer - The image data as a Buffer
 * @param userId - The user ID for organizing files
 * @param filename - Optional custom filename
 * @returns The storage path and public URL
 */
export async function uploadSoulPortrait(
    imageBuffer: Buffer,
    userId: string,
    filename?: string
): Promise<UploadResult> {
    // Validate size
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
        throw new Error(`Image must be less than ${MAX_IMAGE_SIZE / 1000000}MB`)
    }

    // Generate unique file path
    const timestamp = Date.now()
    const uniqueId = Math.random().toString(36).substring(2, 8)
    const name = filename || `portrait_${timestamp}_${uniqueId}`
    const filePath = `${userId}/${name}.png`

    // Upload to Supabase storage
    const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(filePath, imageBuffer, {
            contentType: "image/png",
            upsert: false // Don't overwrite existing files
        })

    if (error) {
        console.error("Supabase upload error:", error)
        throw new Error("Error uploading portrait image")
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

    return {
        path: filePath,
        url: urlData.publicUrl
    }
}

/**
 * Upload portrait from a URL (downloads and re-uploads to Supabase)
 * Used when Replicate returns a temporary URL
 * 
 * @param imageUrl - The temporary image URL to download
 * @param userId - The user ID for organizing files
 */
export async function uploadPortraitFromUrl(
    imageUrl: string,
    userId: string
): Promise<UploadResult> {
    // Download the image
    const response = await fetch(imageUrl)

    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to our storage
    return uploadSoulPortrait(buffer, userId)
}

/**
 * Delete a soul portrait from storage
 * 
 * @param filePath - The storage path of the file to delete
 */
export async function deleteSoulPortrait(filePath: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([filePath])

    if (error) {
        console.error("Error deleting portrait:", error)
        throw new Error("Error deleting portrait image")
    }
}

/**
 * Get a signed URL for private access (if bucket is not public)
 * 
 * @param filePath - The storage path
 * @param expiresIn - Seconds until expiry (default 24 hours)
 */
export async function getSignedPortraitUrl(
    filePath: string,
    expiresIn: number = 86400
): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, expiresIn)

    if (error) {
        throw new Error("Error generating signed URL")
    }

    return data.signedUrl
}
