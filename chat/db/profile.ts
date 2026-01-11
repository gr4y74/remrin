import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"

/**
 * Sync social fields to user_profiles table
 */
async function syncToUserProfiles(profile: any) {
  try {
    const socialData = {
      user_id: profile.user_id || profile.id,
      username: profile.username,
      display_name: profile.display_name,
      hero_image_url: profile.image_url,
      bio: profile.bio,
      updated_at: new Date().toISOString()
    }

    // Only update if we have the required user_id and username
    if (socialData.user_id && socialData.username) {
      await supabase
        .from("user_profiles")
        .upsert(socialData, { onConflict: 'user_id' })
    }
  } catch (err) {
    console.error("Failed to sync to user_profiles:", err)
  }
}

export const getProfileByUserId = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return profile
}

export const getProfilesByUserId = async (userId: string) => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user profiles:", error)
    return []
  }

  return profiles
}

export const createProfile = async (profile: any) => {
  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .insert([profile])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Sync to social profile
  await syncToUserProfiles(createdProfile)

  return createdProfile
}

export const updateProfile = async (
  profileId: string,
  profile: any
) => {
  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", profileId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Sync to social profile
  await syncToUserProfiles(updatedProfile)

  return updatedProfile
}

export const deleteProfile = async (profileId: string) => {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
