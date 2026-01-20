import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LastSeenInfo {
    userId: string;
    lastSeen: string;
    status: 'online' | 'away' | 'busy' | 'invisible';
    awayMessage?: string;
}

export function useLastSeen(userIds: string[]) {
    const [lastSeenData, setLastSeenData] = useState<Map<string, LastSeenInfo>>(new Map());
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (userIds.length === 0) {
            setLoading(false);
            return;
        }

        const fetchLastSeen = async () => {
            const { data, error } = await supabase
                .from('user_presence')
                .select('user_id, last_seen, status, away_message')
                .in('user_id', userIds);

            if (data) {
                const map = new Map<string, LastSeenInfo>();
                data.forEach((item) => {
                    map.set(item.user_id, {
                        userId: item.user_id,
                        lastSeen: item.last_seen,
                        status: item.status,
                        awayMessage: item.away_message || undefined,
                    });
                });
                setLastSeenData(map);
            }

            setLoading(false);
        };

        fetchLastSeen();

        // Subscribe to changes
        const channel = supabase
            .channel('user_presence_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_presence',
                    filter: `user_id=in.(${userIds.join(',')})`,
                },
                (payload) => {
                    const updated = payload.new as any;
                    if (updated) {
                        setLastSeenData((prev) => {
                            const next = new Map(prev);
                            next.set(updated.user_id, {
                                userId: updated.user_id,
                                lastSeen: updated.last_seen,
                                status: updated.status,
                                awayMessage: updated.away_message || undefined,
                            });
                            return next;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userIds.join(',')]);

    const getLastSeen = (userId: string): LastSeenInfo | null => {
        return lastSeenData.get(userId) || null;
    };

    const getLastSeenText = (userId: string): string => {
        const info = lastSeenData.get(userId);
        if (!info) return 'Unknown';

        if (info.status === 'online') return 'Online';
        if (info.status === 'busy') return 'Busy';
        if (info.status === 'invisible') return 'Offline';

        const lastSeenDate = new Date(info.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return lastSeenDate.toLocaleDateString();
    };

    return {
        lastSeenData: Array.from(lastSeenData.values()),
        loading,
        getLastSeen,
        getLastSeenText,
    };
}
