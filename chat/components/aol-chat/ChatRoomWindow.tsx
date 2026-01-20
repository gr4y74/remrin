'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Win95Window } from './Win95Window';
import { Win95Button } from './Win95Button';
import { Win95Input } from './Win95Input';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { useChatRoom } from '@/hooks/useChatRoom';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

// Types
interface ChatMessage {
    id: string;
    username: string;
    message: string;
    message_type: 'user' | 'system' | 'emote';
    created_at: string;
}

interface ChatRoomUser {
    user_id: string;
    username: string;
    status: 'active' | 'away' | 'idle';
}

interface ChatRoomWindowProps {
    roomName: string;
    roomId?: string;
    currentUser: User | null;
    onClose: () => void;
    onOpenIM?: (userId: string, username: string) => void;
}

export const ChatRoomWindow: React.FC<ChatRoomWindowProps> = ({
    roomName,
    roomId,
    currentUser,
    onClose,
    onOpenIM
}) => {
    const currentUsername = currentUser?.user_metadata?.username || 'Guest';
    // Ensure we get the roomId from useChatRoom if not provided via props (though props should have it usually)
    // Actually useChatRoom hook manages the room subscription so it knows the ID best for the channel name
    const { messages, users, sendMessage, roomId: currentRoomId } = useChatRoom(roomName, currentUsername);
    const { typingUsernames, handleTyping } = useTypingIndicator(currentRoomId, currentUsername);

    const [inputValue, setInputValue] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages or typing changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsernames]);

    // Handle sending message
    const handleSend = async () => {
        if (!inputValue.trim()) return;
        await sendMessage(inputValue, currentUser?.id || 'anon');
        setInputValue('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        handleTyping();
    };

    return (
        <Win95Window
            title={`Remrin Chat - ${roomName}`}
            className="w-[800px] h-[500px]"
            onClose={onClose}
            icon="/icons/win95/entire_network_globe-0.png"
        >
            {/* Menu Bar */}
            <div className="flex px-1 py-[2px] border-b border-[#808080] mb-1 text-[11px]">
                <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">File</span>
                <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">People</span>
                <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">View</span>
                <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">Help</span>
            </div>

            <div className="flex h-[calc(100%-60px)] p-1 gap-1">
                {/* Left Panel: Chat Area */}
                <div className="flex-1 flex flex-col">
                    <div className="bg-[#c0c0c0] px-2 py-1 font-bold text-[11px] border-b border-[#808080]">
                        Room: {roomName}
                    </div>

                    <div className="flex-1 bg-white border-2 border-[inset] border-[#808080] m-1 p-2 overflow-y-auto font-['Courier_New',_monospace] text-[13px]">
                        {/* System Message */}
                        <div className="text-[#808080] italic mb-1">*** You have entered {roomName} ***</div>

                        {messages.map(msg => (
                            <div key={msg.id} className="mb-[2px]">
                                {msg.message_type === 'user' ? (
                                    <>
                                        <span className="text-[#0000ff] font-bold">{msg.username}: </span>
                                        <span>{msg.message}</span>
                                    </>
                                ) : (
                                    <span className="text-[#808080] italic">*** {msg.message} ***</span>
                                )}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {typingUsernames.length > 0 && (
                            <div className="text-[#808080] italic text-[12px] animate-pulse">
                                {typingUsernames.join(', ')} {typingUsernames.length === 1 ? 'is' : 'are'} typing<span className="typing-dots">...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-1 bg-[#c0c0c0] border-t border-[#808080]">
                        <div className="flex gap-1">
                            <Win95Input
                                className="flex-1"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyPress}
                                placeholder="Type your message here..."
                                autoFocus
                            />
                            <Win95Button onClick={handleSend} className="font-bold">
                                Send
                            </Win95Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: User List */}
                <div className="w-[200px] flex flex-col bg-[#c0c0c0]">
                    <div className="px-2 py-1 font-bold text-[11px] border-b border-[#808080]">
                        People Here: <span className="text-[#0000ff] font-normal">{users.length}</span>
                    </div>

                    <div className="flex-1 bg-white border-2 border-[inset] border-[#808080] m-1 p-1 overflow-y-auto text-[11px]">
                        {users.map(user => (
                            <div
                                key={user.user_id}
                                onClick={() => setSelectedUser(user.user_id)}
                                className={cn(
                                    "px-1 cursor-pointer select-none truncate hover:border hover:border-dotted hover:border-black",
                                    selectedUser === user.user_id && "bg-[#000080] text-white hover:border-white"
                                )}
                            >
                                {user.username}
                            </div>
                        ))}
                    </div>

                    <div className="p-1 flex flex-col gap-1">
                        <Win95Button
                            className="w-full text-[10px]"
                            disabled={!selectedUser}
                            onClick={() => {
                                if (selectedUser) {
                                    const user = users.find(u => u.user_id === selectedUser);
                                    onOpenIM?.(selectedUser, user?.username || 'Unknown');
                                }
                            }}
                        >
                            Send IM
                        </Win95Button>
                        <Win95Button className="w-full text-[10px]" disabled={!selectedUser}>Get Profile</Win95Button>
                        <Win95Button className="w-full text-[10px]" disabled={!selectedUser}>Add Buddy</Win95Button>
                        <Win95Button className="w-full text-[10px]" disabled={!selectedUser}>Ignore</Win95Button>
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="flex justify-between px-2 py-[2px] text-[10px] border-t border-white shadow-[inset_0px_1px_0px_0px_#808080]">
                <span>Online</span>
                <span className="bg-white border text-[9px] px-1 border-[#808080]">Ready</span>
            </div>
        </Win95Window>
    );
};
