import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export type UserStatus = 'online' | 'away' | 'busy' | 'invisible' | 'offline';

export function useEnhancedPresence(userId: string | undefined, username?: string) {
    const [status, setStatus] = useState<UserStatus>('online');
    const [awayMessage, setAwayMessage] = useState<string>('');
    const supabase = createClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    const updateStatus = useCallback(async (newStatus: UserStatus, message?: string) => {
        if (!userId) return;

        setStatus(newStatus);
        if (message !== undefined) setAwayMessage(message);

        const finalMessage = message ?? awayMessage;

        // 1. Update DB
        await supabase
            .from('user_profiles_chat')
            .update({
                status: newStatus,
                away_message: finalMessage,
                last_seen: new Date().toISOString()
            })
            .eq('user_id', userId);

        // 2. Update Realtime Presence
        if (channelRef.current && username) {
            const presenceState = {
                user_id: userId,
                username: username,
                status: newStatus,
                away_message: finalMessage,
                online_at: new Date().toISOString(),
            };

            await channelRef.current.track(presenceState);
        }

    }, [userId, username, awayMessage]);

    // Initialize Presence Channel
    useEffect(() => {
        if (!userId || !username) return;

        const channel = supabase.channel('buddy-presence', {
            config: {
                presence: {
                    key: username,
                },
            },
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    user_id: userId,
                    username: username,
                    status: 'online',
                    away_message: awayMessage,
                    online_at: new Date().toISOString(),
                });
                channelRef.current = channel;
            }
        });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, username]);

    // Auto-away logic
    useEffect(() => {
        if (!userId) return;

        let idleTimer: NodeJS.Timeout;

        const resetIdleTimer = () => {
            if (status === 'away' && awayMessage === 'Auto-away due to inactivity') {
                updateStatus('online');
            }
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (status === 'online') {
                    updateStatus('away', 'Auto-away due to inactivity');
                }
            }, 5 * 60 * 1000); // 5 minutes
        };

        const handleActivity = () => {
            if (status === 'online' || (status === 'away' && awayMessage === 'Auto-away due to inactivity')) {
                resetIdleTimer();
            }
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('touchstart', handleActivity);

        resetIdleTimer();

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            clearTimeout(idleTimer);
        };
    }, [userId, status, awayMessage, updateStatus]);

    return {
        status,
        awayMessage,
        updateStatus,
        setAwayMessage: (msg: string) => updateStatus(status, msg)
    };
}
