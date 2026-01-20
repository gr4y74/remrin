import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface DirectMessage {
    id: string;
    from_user_id: string;
    to_user_id: string;
    from_username: string;
    to_username: string;
    message: string;
    created_at: string;
    read: boolean;
    delivered_at?: string;
    read_at?: string;
}

export function useDirectMessages(currentUserId: string | undefined) {
    const [activeConversations, setActiveConversations] = useState<Map<string, DirectMessage[]>>(new Map());
    const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
    const supabase = createClient();

    useEffect(() => {
        if (!currentUserId) return;

        // Load initial recent messages (simplified for now, could be better paginated)
        const loadMessages = async () => {
            const { data, error } = await supabase
                .from('direct_messages')
                .select('*')
                .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`)
                .order('created_at', { ascending: true })
                .limit(100);

            if (data) {
                const newConversations = new Map<string, DirectMessage[]>();
                const newUnreadCounts = new Map<string, number>();

                data.forEach((msg) => {
                    const otherId = msg.from_user_id === currentUserId ? msg.to_user_id : msg.from_user_id;
                    const current = newConversations.get(otherId) || [];
                    newConversations.set(otherId, [...current, msg]);

                    // Count unread messages
                    if (msg.to_user_id === currentUserId && !msg.read_at) {
                        newUnreadCounts.set(otherId, (newUnreadCounts.get(otherId) || 0) + 1);
                    }
                });

                setActiveConversations(newConversations);
                setUnreadCounts(newUnreadCounts);
            }
        };

        loadMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel('direct_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `to_user_id=eq.${currentUserId}`,
                },
                (payload) => {
                    const newMsg = payload.new as DirectMessage;
                    setActiveConversations((prev) => {
                        const next = new Map(prev);
                        const otherId = newMsg.from_user_id;
                        const current = next.get(otherId) || [];
                        next.set(otherId, [...current, newMsg]);
                        return next;
                    });

                    // Update unread count
                    setUnreadCounts((prev) => {
                        const next = new Map(prev);
                        const otherId = newMsg.from_user_id;
                        next.set(otherId, (next.get(otherId) || 0) + 1);
                        return next;
                    });

                    // Play sound
                    const audio = new Audio('/sounds/aol/aol-im.mp3');
                    audio.play().catch(() => { });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `from_user_id=eq.${currentUserId}`,
                },
                (payload) => {
                    // Handle read receipt updates for messages we sent
                    const updatedMsg = payload.new as DirectMessage;
                    setActiveConversations((prev) => {
                        const next = new Map(prev);
                        const otherId = updatedMsg.to_user_id;
                        const current = next.get(otherId) || [];
                        const updated = current.map(msg =>
                            msg.id === updatedMsg.id ? updatedMsg : msg
                        );
                        next.set(otherId, updated);
                        return next;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const sendMessage = async (toUserId: string, toUsername: string, message: string, fromUsername: string) => {
        if (!currentUserId) return;

        const { error } = await supabase.from('direct_messages').insert({
            from_user_id: currentUserId,
            to_user_id: toUserId,
            from_username: fromUsername,
            to_username: toUsername,
            message,
        });

        if (!error) {
            // Optimistically add to local state
            const newMsg: DirectMessage = {
                id: Date.now().toString(), // temp id
                from_user_id: currentUserId,
                to_user_id: toUserId,
                from_username: fromUsername,
                to_username: toUsername,
                message,
                created_at: new Date().toISOString(),
                read: false,
                delivered_at: new Date().toISOString(),
            };

            setActiveConversations((prev) => {
                const next = new Map(prev);
                const current = next.get(toUserId) || [];
                next.set(toUserId, [...current, newMsg]);
                return next;
            });
        }
    };

    const markMessagesAsRead = async (partnerId: string) => {
        if (!currentUserId) return;

        const { error } = await supabase.rpc('mark_messages_as_read', {
            p_user_id: currentUserId,
            p_partner_id: partnerId,
        });

        if (!error) {
            // Update local state
            setActiveConversations((prev) => {
                const next = new Map(prev);
                const current = next.get(partnerId) || [];
                const updated = current.map(msg =>
                    msg.to_user_id === currentUserId && !msg.read_at
                        ? { ...msg, read_at: new Date().toISOString(), read: true }
                        : msg
                );
                next.set(partnerId, updated);
                return next;
            });

            // Clear unread count
            setUnreadCounts((prev) => {
                const next = new Map(prev);
                next.delete(partnerId);
                return next;
            });
        }
    };

    return {
        activeConversations,
        unreadCounts,
        sendMessage,
        markMessagesAsRead,
    };
}
