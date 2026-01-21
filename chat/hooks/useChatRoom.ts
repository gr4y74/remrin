import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { chatSounds } from '@/lib/chat/soundManager';

export interface ChatMessage {
    id: string;
    room_id: string;
    user_id: string;
    username: string;
    message: string;
    message_type: 'user' | 'system' | 'emote';
    created_at: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
    attachment_size?: number;
}

export interface ChatUser {
    user_id: string;
    username: string;
    online_at: string;
    status: 'active' | 'idle' | 'away';
}

export interface RoomDetails {
    id: string;
    name: string;
    description: string;
    category: string;
    is_private: boolean;
    owner_id: string;
    banner_url?: string;
}

export function useChatRoom(roomName: string = 'The Lobby', username: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
    const [isModerator, setIsModerator] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const supabase = createClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    // 1. Get or Create Room ID & Check Permissions
    const fetchRoom = useCallback(async (name: string) => {
        let { data: room, error } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('name', name)
            .single();

        if (!room) {
            // Create if not exists (simplistic)
            const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ name: name, category: 'General', is_private: false })
                .select()
                .single();
            if (newRoom) room = newRoom;
        }

        if (room) {
            setRoomId(room.id);
            setRoomDetails(room);
            chatSounds.play('roomEnter');

            // Check if current user is owner
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                if (room.owner_id === user.id) {
                    setIsOwner(true);
                    setIsModerator(true);
                } else {
                    // Check if mod
                    const { data: mod } = await supabase
                        .from('room_moderators')
                        .select('id')
                        .eq('room_id', room.id)
                        .eq('user_id', user.id)
                        .single();
                    if (mod) setIsModerator(true);
                }

                // Check if muted
                const { data: mute } = await supabase
                    .from('room_mutes')
                    .select('id')
                    .eq('room_id', room.id)
                    .eq('user_id', user.id)
                    .single();
                if (mute) setIsMuted(true);
            }
        }
    }, [supabase]);

    useEffect(() => {
        fetchRoom(roomName);
    }, [roomName, fetchRoom]);

    // 2. Subscribe to Messages and Presence
    useEffect(() => {
        if (!roomId || !username) return;

        // Load history
        const loadHistory = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true }) // last 100
                .limit(100);

            if (data) setMessages(data);
        };
        loadHistory();

        // Subscribe
        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: username,
                },
            },
        });

        channel
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as ChatMessage]);
                if (payload.new.username !== username) {
                    chatSounds.play('imReceive');
                }
            })
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const onlineUsers: ChatUser[] = [];

                for (const key in newState) {
                    const state = newState[key];
                    if (state && state.length > 0) {
                        // @ts-ignore
                        const userState = state[0] as any;
                        onlineUsers.push({
                            // @ts-ignore
                            user_id: userState.user_id || key,
                            username: key,
                            online_at: new Date().toISOString(),
                            status: 'active'
                        });
                    }
                }
                setUsers(onlineUsers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    const { data: { user } } = await supabase.auth.getUser();
                    await channel.track({
                        user_id: user?.id,
                        online_at: new Date().toISOString(),
                        status: 'active'
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, username, supabase]);

    const sendMessage = async (text: string, userId: string, attachment?: { url: string, type: string, name: string, size: number }) => {
        if (!roomId) return;
        if (isMuted) {
            alert("You are muted in this room.");
            return;
        }

        await supabase.from('chat_messages').insert({
            room_id: roomId,
            user_id: userId,
            username: username,
            message: text,
            message_type: 'user',
            attachment_url: attachment?.url,
            attachment_type: attachment?.type,
            attachment_name: attachment?.name,
            attachment_size: attachment?.size
        });
    };

    const kickUser = async (targetUserId: string) => {
        if (!roomId || !isModerator) return;
        await fetch(`/api/chat/rooms/${roomId}/moderation/kick`, {
            method: 'POST', body: JSON.stringify({ user_id: targetUserId })
        });
    };

    const banUser = async (targetUserId: string) => {
        if (!roomId || !isModerator) return;
        await fetch(`/api/chat/rooms/${roomId}/moderation/ban`, {
            method: 'POST', body: JSON.stringify({ user_id: targetUserId })
        });
    };

    const muteUser = async (targetUserId: string) => {
        if (!roomId || !isModerator) return;
        await fetch(`/api/chat/rooms/${roomId}/moderation/mute`, {
            method: 'POST', body: JSON.stringify({ user_id: targetUserId })
        });
    };

    return {
        messages,
        users,
        sendMessage,
        roomId,
        roomDetails,
        isModerator,
        isOwner,
        isMuted,
        kickUser,
        banUser,
        muteUser,
        joinRoom: (name: string) => fetchRoom(name)
    };
}
