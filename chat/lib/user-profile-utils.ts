import { UserProfile } from '@/types/profile';

/**
 * Shared Profile Utilities (Safe for Client & Server)
 */

/**
 * Get user's profile URL
 * Always uses username, never UUID
 */
export function getUserProfileUrl(username: string): string {
    if (!username) return '#';
    return `/profile/${username}`;
}

/**
 * Get user's display name
 * Fallback: display_name → username → "Unknown User"
 */
export function getUserDisplayName(profile: any): string {
    if (!profile) return 'Unknown User';
    return profile.display_name || profile.username || 'Unknown User';
}

/**
 * Get user's avatar URL
 * Returns Supabase storage URL or generated initials avatar
 */
export function getUserAvatarUrl(profile: any): string {
    // Check multiple possible avatar property names
    const avatarUrl = profile?.hero_image_url || profile?.avatar_url || profile?.image_url;

    if (avatarUrl) {
        return avatarUrl;
    }

    // Fallback to initials-based avatar service or local default
    const name = profile?.display_name || profile?.username || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=eb6f92&color=fff`;
}

/**
 * Get user's banner URL
 * Returns Supabase storage URL or null
 */
export function getUserBannerUrl(profile: Partial<UserProfile> | null): string | null {
    return profile?.banner_url || null;
}
