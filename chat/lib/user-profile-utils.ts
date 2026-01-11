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
export function getUserDisplayName(profile: Partial<UserProfile> | null): string {
    if (!profile) return 'Unknown User';
    return profile.display_name || profile.username || 'Unknown User';
}

/**
 * Get user's avatar URL
 * Returns Supabase storage URL or generated initials avatar
 */
export function getUserAvatarUrl(profile: Partial<UserProfile> | null): string {
    if (profile?.hero_image_url) {
        return profile.hero_image_url;
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
