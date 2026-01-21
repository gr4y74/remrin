'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';
import { XPInput } from './XPInput';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { useChatRoom } from '@/hooks/useChatRoom';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { EmoticonPicker } from './EmoticonPicker';
import { prepareForMarkdown } from '@/lib/chat/emoticons';
import ReactMarkdown from 'react-markdown';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@/components/ui/context-menu';
import { IconPaperclip, IconSend, IconMoodSmile, IconSettings, IconLock } from '@tabler/icons-react';
import { toast } from 'sonner';
import { RoomSettingsPanel } from './RoomSettingsPanel';

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
    const {
        messages,
        users,
        sendMessage,
        roomId: currentRoomId,
        roomDetails,
        isModerator,
        isOwner,
        isMuted,
        kickUser,
        banUser,
        muteUser
    } = useChatRoom(roomName, currentUsername);
    const { typingUsernames, handleTyping } = useTypingIndicator(currentRoomId, currentUsername);

    const [inputValue, setInputValue] = useState('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages or typing changes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsernames]);

    // Handle sending message
    const handleSend = async () => {
        if (!inputValue.trim()) return;
        if (isMuted) {
            toast.error("You are muted in this room.");
            return;
        }
        await sendMessage(inputValue, currentUser?.id || 'anon');
        setInputValue('');
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/chat/upload', { method: 'POST', body: formData });
            const data = await res.json();

            if (data.url) {
                await sendMessage(inputValue || (data.type === 'image' ? "Sent an image" : "Sent a file"), currentUser?.id || 'anon', {
                    url: data.url, type: data.type, name: data.name, size: data.size
                });
                setInputValue('');
            } else {
                toast.error('Upload failed');
            }
        } catch (err) {
            toast.error('Upload error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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

    const handleKick = async (userId: string) => {
        await kickUser(userId);
        toast.success("User kicked (signal sent)");
    };

    const handleBan = async (userId: string) => {
        await banUser(userId);
        toast.success("User banned");
    };

    const handleMute = async (userId: string) => {
        await muteUser(userId);
        toast.success("User muted");
    };

    return (
        <>
            <XPWindow
                title={`Remrin Chat - ${roomName}`}
                className="w-full h-full min-h-[500px] flex flex-col shadow-2xl"
                onClose={onClose}
                icon="/icons/win95/entire_network_globe-0.png"
            >
                {/* Header / Toolbar */}
                <div className="bg-[#ece9d8] border-b border-[#d4d0c8] px-2 py-1 flex items-center justify-between">
                    <div className="font-bold text-[#5e2b8d] text-[13px] flex items-center gap-2">
                        <span className="bg-white/50 px-2 py-0.5 rounded border border-[#d4d0c8] flex items-center gap-1">
                            {roomDetails?.is_private && <IconLock size={12} className="text-yellow-600" />}
                            {roomName}
                        </span>
                        <span className="text-[#808080] font-normal text-[11px] truncate max-w-[200px]">
                            {roomDetails?.description || (roomDetails?.is_private ? 'Private Room' : 'Public Room')}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        {(isOwner || isModerator) && (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="text-[10px] text-[#0054e3] hover:underline flex items-center gap-1 border border-transparent hover:border-[#7F9DB9] hover:bg-white px-1 rounded"
                            >
                                <IconSettings size={12} /> Options
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 p-2 gap-2 bg-[#ece9d8] overflow-hidden">
                    {/* Left Panel: Chat Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex-1 bg-white border border-[#7f9db9] rounded-[2px] p-0 overflow-y-auto font-['Tahoma',_sans-serif] text-[12px] shadow-inner mb-2">
                            {/* System Message */}
                            <div className="bg-[#f0f0f0] p-2 text-[#808080] italic text-center border-b border-gray-100 text-[11px]">
                                *** You have entered {roomName} ***
                            </div>

                            <div className="flex flex-col">
                                {messages.map((msg, index) => {
                                    const isOwnMessage = msg.username === currentUsername;
                                    const msgUser = users.find(u => u.username === msg.username);

                                    return (
                                        <ContextMenu key={msg.id}>
                                            <ContextMenuTrigger>
                                                <div className={cn(
                                                    "px-3 py-1.5 group transition-colors",
                                                    index % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]",
                                                    "hover:bg-[#eef3fa]"
                                                )}>
                                                    {msg.message_type === 'user' ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-[#5e2b8d] font-bold text-[11px] cursor-pointer hover:underline">
                                                                    {msg.username}
                                                                </span>
                                                                <span className="text-gray-400 text-[9px]">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className="text-[#000] leading-relaxed">
                                                                <ReactMarkdown components={{ p: 'span' }}>{prepareForMarkdown(msg.message)}</ReactMarkdown>

                                                                {msg.attachment_url && (
                                                                    <div className="mt-2">
                                                                        {msg.attachment_type === 'image' ? (
                                                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block w-fit">
                                                                                <img src={msg.attachment_url} alt="Attachment" className="max-w-[200px] max-h-[150px] rounded border border-gray-200 shadow-sm hover:opacity-90 transition-opacity" />
                                                                            </a>
                                                                        ) : (
                                                                            <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#0054e3] hover:underline bg-blue-50 p-2 rounded border border-blue-100 w-fit">
                                                                                <IconPaperclip size={14} className="mr-1" />
                                                                                {msg.attachment_name || 'Attached File'}
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[#808080] italic text-[11px] py-1 text-center">
                                                            *** {msg.message} ***
                                                        </div>
                                                    )}
                                                </div>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent>
                                                <ContextMenuItem onClick={() => navigator.clipboard.writeText(msg.message)}>Copy Text</ContextMenuItem>
                                                {(isModerator || isOwner) && !isOwnMessage && msgUser && (
                                                    <>
                                                        <ContextMenuSeparator />
                                                        <ContextMenuItem onSelect={() => handleKick(msgUser.user_id)}>Kick {msg.username}</ContextMenuItem>
                                                        <ContextMenuItem onSelect={() => handleBan(msgUser.user_id)} className="text-red-600">Ban {msg.username}</ContextMenuItem>
                                                        <ContextMenuItem onSelect={() => handleMute(msgUser.user_id)}>Mute {msg.username}</ContextMenuItem>
                                                    </>
                                                )}
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    )
                                })}
                            </div>

                            {/* Typing Indicator */}
                            {typingUsernames.length > 0 && (
                                <div className="p-2 text-[#808080] italic text-[11px] flex items-center gap-1 bg-gray-50/50 sticky bottom-0 backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    <span className="ml-1">{typingUsernames.join(', ')} {typingUsernames.length === 1 ? 'is' : 'are'} typing...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="bg-white rounded-[2px] border border-[#7f9db9] p-1 flex flex-col gap-1 shadow-sm relative">
                            {isMuted && (
                                <div className="absolute inset-0 bg-gray-100/80 z-10 flex items-center justify-center text-red-600 font-bold text-xs">
                                    You have been muted in this room.
                                </div>
                            )}
                            {/* Formatting Bar (Visual Only for now) */}
                            <div className="flex items-center gap-1 px-1 py-0.5 bg-[#f0f0f0] rounded-sm border-b border-gray-100 text-[#444]">
                                <button className="p-0.5 hover:bg-gray-200 rounded font-bold">B</button>
                                <button className="p-0.5 hover:bg-gray-200 rounded italic">I</button>
                                <button className="p-0.5 hover:bg-gray-200 rounded underline">U</button>
                                <div className="h-3 w-[1px] bg-gray-300 mx-1" />
                                <button className="p-0.5 hover:bg-gray-200 rounded text-[10px] flex items-center gap-1 text-[#0054e3]"><span className="w-2 h-2 rounded-full bg-[#0054e3]" /> A</button>
                            </div>

                            <div className="flex gap-2 p-1">
                                <input
                                    className="flex-1 outline-none text-[13px] font-['Tahoma',_sans-serif]"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder={isMuted ? "You are muted..." : "Type your message here..."}
                                    disabled={isMuted}
                                    autoFocus
                                />
                                <div className="flex items-center gap-1">
                                    <EmoticonPicker onSelect={(emoji) => setInputValue(prev => prev + emoji)} />
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1.5 text-gray-500 hover:text-[#0054e3] hover:bg-blue-50 rounded transition-colors"
                                        disabled={isUploading || isMuted}
                                        title="Attach File"
                                    >
                                        <IconPaperclip size={18} />
                                    </button>
                                    <XPButton onClick={handleSend} variant="primary" className="px-5 py-1.5 flex items-center gap-1 shadow-md" disabled={isUploading || isMuted}>
                                        {isUploading ? '...' : <>Send <IconSend size={12} /></>}
                                    </XPButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: User List */}
                    <div className="w-[200px] flex flex-col gap-2">
                        <div className="bg-[#d8c3e8] px-2 py-1 rounded-t-[2px] border border-[#d8c3e8] border-b-0 font-bold text-[11px] text-[#5e2b8d] flex justify-between items-center shadow-sm">
                            <span>Participants</span>
                            <span className="bg-white px-1.5 rounded-full text-[10px] border border-blue-200">{users.length}</span>
                        </div>

                        <div className="flex-1 bg-white border border-[#7f9db9] rounded-b-[2px] p-1 overflow-y-auto text-[11px] shadow-inner -mt-2">
                            {users.map(user => (
                                <ContextMenu key={user.user_id}>
                                    <ContextMenuTrigger>
                                        <div
                                            onClick={() => setSelectedUser(user.user_id)}
                                            onDoubleClick={() => {
                                                if (user.user_id !== currentUser?.id) {
                                                    onOpenIM?.(user.user_id, user.username);
                                                }
                                            }}
                                            className={cn(
                                                "px-2 py-1 cursor-pointer select-none truncate flex items-center gap-2 rounded-[1px] transition-colors",
                                                selectedUser === user.user_id
                                                    ? "bg-[#5e2b8d] text-white"
                                                    : "hover:bg-[#f3ebf9] text-[#2d005d]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold",
                                                "bg-purple-100 text-purple-600 border border-purple-200"
                                            )}>
                                                {user.username.charAt(0).toUpperCase()}
                                            </div>
                                            {user.username}
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => {
                                            if (user.user_id !== currentUser?.id) {
                                                onOpenIM?.(user.user_id, user.username);
                                            }
                                        }}>Instant Message</ContextMenuItem>
                                        <ContextMenuItem>View Profile</ContextMenuItem>
                                        {(isModerator || isOwner) && user.user_id !== currentUser?.id && (
                                            <>
                                                <ContextMenuSeparator />
                                                <ContextMenuItem onSelect={() => handleKick(user.user_id)}>Kick User</ContextMenuItem>
                                                <ContextMenuItem onSelect={() => handleBan(user.user_id)} className="text-red-600">Ban User</ContextMenuItem>
                                                <ContextMenuItem onSelect={() => handleMute(user.user_id)}>Mute User</ContextMenuItem>
                                            </>
                                        )}
                                    </ContextMenuContent>
                                </ContextMenu>
                            ))}
                        </div>

                        <div className="flex flex-col gap-1.5 p-2 bg-[#d4d0c8] rounded border border-white shadow-[inset_1px_1px_0_rgba(0,0,0,0.1)]">
                            <XPButton
                                className="w-full text-[10px]"
                                disabled={!selectedUser || selectedUser === currentUser?.id}
                                onClick={() => {
                                    if (selectedUser) {
                                        const user = users.find(u => u.user_id === selectedUser);
                                        onOpenIM?.(selectedUser, user?.username || 'Unknown');
                                    }
                                }}
                            >
                                Send IM
                            </XPButton>
                            <XPButton className="w-full text-[10px]" disabled={!selectedUser}>View Profile</XPButton>
                            <XPButton className="w-full text-[10px]" disabled={!selectedUser}>Ignore</XPButton>
                        </div>
                    </div>
                </div>
            </XPWindow>

            {showSettings && currentRoomId && (
                <RoomSettingsPanel roomId={currentRoomId} onClose={() => setShowSettings(false)} />
            )}
        </>
    );
};
