import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface MessengerSettings {
    away_message: string | null;
    show_online: boolean;
    sound_enabled: boolean;
    notification_enabled: boolean;
}

export interface UnifiedProfile {
    user_id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    pronouns: string | null;
    location: string | null;
    website_url: string | null;
    banner_url: string | null;
    messenger_settings: MessengerSettings;
    preferred_interface: 'proper' | 'cockpit';
    cockpit_language: string;
    cockpit_theme: 'light' | 'dark';
    enable_analytics: boolean;
    enable_memory: boolean;
    enable_thinking: boolean;
    enable_voice: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Hook to manage unified user profile that serves both main site and messenger
 * Includes real-time updates for avatar, display name, and other profile changes
 */
export function useUnifiedProfile(userId?: string) {
    const [profile, setProfile] = useState<UnifiedProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    // Fetch profile from database
    const fetchProfile = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error: fetchError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (data) {
                setProfile(data as UnifiedProfile);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching unified profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    }, [userId, supabase]);

    // Subscribe to real-time profile updates
    useEffect(() => {
        if (!userId) return;

        fetchProfile();

        // Subscribe to postgres changes
        const channel: RealtimeChannel = supabase
            .channel(`profile-${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('Profile updated:', payload);
                    setProfile(payload.new as UnifiedProfile);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, supabase, fetchProfile]);

    // Update profile
    const updateProfile = useCallback(async (updates: Partial<UnifiedProfile>) => {
        if (!userId) {
            return { error: new Error('No user ID provided') };
        }

        try {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', userId);

            if (updateError) throw updateError;

            // Optimistically update local state
            setProfile(prev => prev ? { ...prev, ...updates } : null);

            return { error: null };
        } catch (err) {
            console.error('Error updating profile:', err);
            return { error: err instanceof Error ? err : new Error('Failed to update profile') };
        }
    }, [userId, supabase]);

    // Update messenger settings specifically
    const updateMessengerSettings = useCallback(async (settings: Partial<MessengerSettings>) => {
        if (!userId || !profile) {
            return { error: new Error('No user ID or profile') };
        }

        const newSettings = {
            ...profile.messenger_settings,
            ...settings
        };

        return updateProfile({ messenger_settings: newSettings });
    }, [userId, profile, updateProfile]);

    // Set away message
    const setAwayMessage = useCallback(async (message: string | null) => {
        return updateMessengerSettings({ away_message: message });
    }, [updateMessengerSettings]);

    // Toggle online visibility
    const setShowOnline = useCallback(async (show: boolean) => {
        return updateMessengerSettings({ show_online: show });
    }, [updateMessengerSettings]);

    // Toggle sound
    const setSoundEnabled = useCallback(async (enabled: boolean) => {
        return updateMessengerSettings({ sound_enabled: enabled });
    }, [updateMessengerSettings]);

    // Toggle notifications
    const setNotificationEnabled = useCallback(async (enabled: boolean) => {
        return updateMessengerSettings({ notification_enabled: enabled });
    }, [updateMessengerSettings]);

    return {
        profile,
        loading,
        error,
        updateProfile,
        updateMessengerSettings,
        setAwayMessage,
        setShowOnline,
        setSoundEnabled,
        setNotificationEnabled,
        refreshProfile: fetchProfile
    };
}

/**
 * Hook to listen for any user's profile updates (for buddy list)
 * This allows the messenger to update buddy avatars in real-time
 */
export function useProfileUpdates(userIds: string[]) {
    const [updates, setUpdates] = useState<Map<string, Partial<UnifiedProfile>>>(new Map());
    const supabase = createClient();

    useEffect(() => {
        if (userIds.length === 0) return;

        // Subscribe to profile updates for all provided user IDs
        const channel = supabase
            .channel('profile-updates-batch')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_profiles',
                    filter: `user_id=in.(${userIds.join(',')})`
                },
                (payload) => {
                    const updated = payload.new as UnifiedProfile;
                    setUpdates(prev => {
                        const newMap = new Map(prev);
                        newMap.set(updated.user_id, {
                            avatar_url: updated.avatar_url,
                            display_name: updated.display_name,
                            username: updated.username
                        });
                        return newMap;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userIds.join(','), supabase]);

    return updates;
}
