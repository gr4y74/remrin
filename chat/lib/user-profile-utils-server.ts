import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { UserProfile } from '@/types/profile';

/**
 * Get user's public profile data (Server Side)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient(cookies());
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error(`Error fetching profile for user ${userId}:`, error);
        return null;
    }

    return data;
}

/**
 * Get user's profile by username (Server Side)
 */
export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
    const supabase = createClient(cookies());
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('username', username)
        .single();

    if (error) {
        console.error(`Error fetching profile for username ${username}:`, error);
        return null;
    }

    return data;
}
