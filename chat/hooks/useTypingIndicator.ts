import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
    userId: string;
    username: string;
    timestamp: number;
}

interface TypingIndicatorOptions {
    channelName: string;
    currentUserId: string;
    currentUsername: string;
    typingTimeout?: number;
}

export function useTypingIndicator(
    channelOrOptions: string | null | TypingIndicatorOptions,
    legacyUsername?: string
) {
    // Resolve options from overloaded arguments
    const options: TypingIndicatorOptions = (typeof channelOrOptions === 'object' && channelOrOptions !== null)
        ? channelOrOptions
        : {
            channelName: channelOrOptions || '',
            currentUserId: LegacyUserId(legacyUsername),
            currentUsername: legacyUsername || 'anon',
            typingTimeout: 2000
        };

    // Helper to generate a fake userId for legacy calls if needed, 
    // but ideally legacy calls should just use username as ID or we update them.
    function LegacyUserId(name?: string) { return name || 'anon'; }

    const { channelName, currentUserId, currentUsername, typingTimeout = 2000 } = options;

    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
    const supabase = createClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!channelName || !currentUserId) return;

        const channel = supabase.channel(`typing:${channelName}`, {
            config: { broadcast: { self: false } },
        });

        channel
            .on('broadcast', { event: 'typing_start' }, (payload) => {
                const { userId, username } = payload.payload;
                if (userId !== currentUserId) {
                    setTypingUsers((prev) => {
                        const next = new Map(prev);
                        next.set(userId, { userId, username, timestamp: Date.now() });
                        return next;
                    });
                }
            })
            .on('broadcast', { event: 'typing_stop' }, (payload) => {
                const { userId } = payload.payload;
                setTypingUsers((prev) => {
                    const next = new Map(prev);
                    next.delete(userId);
                    return next;
                });
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            supabase.removeChannel(channel);
        };
    }, [channelName, currentUserId]);

    // Cleanup stale
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setTypingUsers((prev) => {
                let changed = false;
                const next = new Map(prev);
                for (const [userId, user] of next.entries()) {
                    if (now - user.timestamp > typingTimeout + 1000) {
                        next.delete(userId);
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [typingTimeout]);

    const startTyping = useCallback(() => {
        if (!channelRef.current || !currentUserId) return;

        if (!isTypingRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing_start',
                payload: { userId: currentUserId, username: currentUsername },
            });
            isTypingRef.current = true;
        }

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => stopTyping(), typingTimeout);
    }, [currentUserId, currentUsername, typingTimeout]);

    const stopTyping = useCallback(() => {
        if (!channelRef.current || !currentUserId) return;

        if (isTypingRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'typing_stop',
                payload: { userId: currentUserId },
            });
            isTypingRef.current = false;
        }
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }, [currentUserId]);

    const getTypingUsernames = useCallback(() => {
        return Array.from(typingUsers.values()).map(u => u.username);
    }, [typingUsers]);

    return {
        typingUsers: Array.from(typingUsers.values()),
        typingUsernames: getTypingUsernames(),
        isAnyoneTyping: typingUsers.size > 0,
        startTyping,
        stopTyping,
        handleTyping: startTyping, // Legacy alias
    };
}
