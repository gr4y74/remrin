import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
    id: string;
    room_id: string;
    user_id: string;
    username: string;
    message: string;
    message_type: 'user' | 'system' | 'emote';
    created_at: string;
}

export interface ChatUser {
    user_id: string;
    username: string;
    online_at: string;
    status: 'active' | 'idle' | 'away';
}

export function useChatRoom(roomName: string = 'The Lobby', username: string) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const supabase = createClient();
    const channelRef = useRef<RealtimeChannel | null>(null);

    // 1. Get or Create Room ID
    const fetchRoom = async (name: string) => {
        let { data: room, error } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('name', name)
            .single();

        if (!room) {
            // Create if not exists (for now, simplistic)
            const { data: newRoom } = await supabase
                .from('chat_rooms')
                .insert({ name: name, category: 'General', is_public: true })
                .select()
                .single();
            if (newRoom) room = newRoom;
        }

        if (room) setRoomId(room.id);
    };

    useEffect(() => {
        fetchRoom(roomName);
    }, [roomName]);

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
                // Play sound
                const audio = new Audio('/sounds/aol/aol-im.mp3'); // We can change this to a room-msg sound later
                audio.play().catch(() => { });
            })
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const onlineUsers: ChatUser[] = [];

                for (const key in newState) {
                    const state = newState[key];
                    if (state && state.length > 0) {
                        // @ts-ignore
                        onlineUsers.push({
                            user_id: key, // Using username as key might be better for uniqueness if IDs aren't consistent, but user_id is safer
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
                    await channel.track({
                        online_at: new Date().toISOString(),
                        status: 'active'
                    });
                }
            });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, username]);

    const sendMessage = async (text: string, userId: string) => {
        if (!roomId) return;

        // Optimization: Optimistic update could go here, but let's trust Supabase for now to keep it simple
        await supabase.from('chat_messages').insert({
            room_id: roomId,
            user_id: userId,
            username: username,
            message: text,
            message_type: 'user'
        });
    };

    return {
        messages,
        users,
        sendMessage,
        roomId,
        joinRoom: (name: string) => fetchRoom(name) // Expose ability to switch rooms
    };
}
