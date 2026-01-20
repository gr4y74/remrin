import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Buddy {
    buddy_id: string;
    buddy_username: string;
    nickname: string | null;
    group_name: string;
    is_favorite: boolean;
    status: 'online' | 'away' | 'busy' | 'offline';
    away_message: string | null;
    last_seen: string | null;
}

export interface BlockedUser {
    id: string;
    blocked_id: string;
    reason: string | null;
    created_at: string;
    user_profiles_chat?: {
        username: string;
        avatar_url: string | null;
    };
}

export function useBuddyList() {
    const [buddies, setBuddies] = useState<Buddy[]>([]);
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    // Fetch buddies from API
    const fetchBuddies = useCallback(async () => {
        try {
            const response = await fetch('/api/chat/buddies');
            const data = await response.json();

            if (response.ok) {
                setBuddies(data.buddies || []);
            } else {
                setError(data.error);
            }
        } catch (err) {
            setError('Failed to fetch buddies');
            console.error('Fetch buddies error:', err);
        }
    }, []);

    // Fetch blocked users
    const fetchBlocked = useCallback(async () => {
        try {
            const response = await fetch('/api/chat/block');
            const data = await response.json();

            if (response.ok) {
                setBlockedUsers(data.blocked || []);
            }
        } catch (err) {
            console.error('Fetch blocked error:', err);
        }
    }, []);

    // Add a buddy
    const addBuddy = useCallback(async (
        buddyUsername: string,
        groupName: string = 'Buddies',
        nickname?: string
    ): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch('/api/chat/buddies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buddyUsername, groupName, nickname })
            });

            const data = await response.json();

            if (response.ok) {
                await fetchBuddies(); // Refresh list
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (err) {
            return { success: false, error: 'Failed to add buddy' };
        }
    }, [fetchBuddies]);

    // Remove a buddy
    const removeBuddy = useCallback(async (buddyId: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/chat/buddies/${buddyId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setBuddies(prev => prev.filter(b => b.buddy_id !== buddyId));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Remove buddy error:', err);
            return false;
        }
    }, []);

    // Update buddy (nickname, group, favorite)
    const updateBuddy = useCallback(async (
        buddyId: string,
        updates: { nickname?: string; groupName?: string; isFavorite?: boolean }
    ): Promise<boolean> => {
        try {
            const response = await fetch(`/api/chat/buddies/${buddyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            if (response.ok) {
                await fetchBuddies();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Update buddy error:', err);
            return false;
        }
    }, [fetchBuddies]);

    // Block a user
    const blockUser = useCallback(async (userId: string, reason?: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/chat/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, reason })
            });

            if (response.ok) {
                // Remove from buddies if they were there
                setBuddies(prev => prev.filter(b => b.buddy_id !== userId));
                await fetchBlocked();
                return true;
            }
            return false;
        } catch (err) {
            console.error('Block user error:', err);
            return false;
        }
    }, [fetchBlocked]);

    // Unblock a user
    const unblockUser = useCallback(async (blockedId: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/chat/block/${blockedId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setBlockedUsers(prev => prev.filter(b => b.blocked_id !== blockedId));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Unblock user error:', err);
            return false;
        }
    }, []);

    // Check if a user is blocked
    const isBlocked = useCallback((userId: string): boolean => {
        return blockedUsers.some(b => b.blocked_id === userId);
    }, [blockedUsers]);

    // Group buddies by group_name
    const groupedBuddies = useCallback(() => {
        const groups: Record<string, Buddy[]> = {};

        buddies.forEach(buddy => {
            const groupName = buddy.group_name || 'Buddies';
            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(buddy);
        });

        // Sort each group: favorites first, then by username
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
                return a.buddy_username.localeCompare(b.buddy_username);
            });
        });

        return groups;
    }, [buddies]);

    // Initial load
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchBuddies(), fetchBlocked()]);
            setLoading(false);
        };
        load();
    }, [fetchBuddies, fetchBlocked]);

    // Subscribe to presence changes for buddy status updates
    useEffect(() => {
        if (buddies.length === 0) return;

        const channel = supabase.channel('buddy-presence');

        // Track presence for all buddies
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();

                setBuddies(prev => prev.map(buddy => {
                    const presenceKey = buddy.buddy_username;
                    const states = state[presenceKey];
                    const isOnline = !!states && states.length > 0;

                    if (isOnline) {
                        // Find the most relevant status from presence payloads
                        const payload = states[0] as any;
                        const status = payload.status === 'away' ? 'away' :
                            payload.status === 'busy' ? 'busy' : 'online';
                        return {
                            ...buddy,
                            status,
                            away_message: payload.away_message || buddy.away_message
                        };
                    }

                    return {
                        ...buddy,
                        status: 'offline'
                    };
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [buddies.length, supabase]);

    return {
        buddies,
        blockedUsers,
        loading,
        error,
        addBuddy,
        removeBuddy,
        updateBuddy,
        blockUser,
        unblockUser,
        isBlocked,
        groupedBuddies,
        refreshBuddies: fetchBuddies
    };
}
