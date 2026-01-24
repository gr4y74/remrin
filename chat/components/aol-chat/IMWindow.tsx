'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';
import { DirectMessage } from '@/hooks/useDirectMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useConversationState } from '@/hooks/useConversationState';
import { EmoticonPicker } from './EmoticonPicker';
import { prepareForMarkdown } from '@/lib/chat/emoticons';
import ReactMarkdown from 'react-markdown';
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu';
import { IconPaperclip, IconSend, IconBold, IconItalic, IconUnderline, IconTextColor } from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

interface IMWindowProps {
    partnerUsername: string;
    partnerId: string;
    messages: DirectMessage[];
    currentUsername: string;
    currentUserId: string;
    onSend: (message: string, attachment?: any) => void;
    onClose: () => void;
    onMarkAsRead?: () => void;
    position?: { x: number; y: number };
}

export const IMWindow: React.FC<IMWindowProps> = ({
    partnerUsername,
    partnerId,
    messages,
    currentUsername,
    currentUserId,
    onSend,
    onClose,
    onMarkAsRead,
    position = { x: 50, y: 50 }
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Conversation state integration
    const { state, updateDraft, updateScrollPosition, markAsRead, clearDraft } =
        useConversationState(currentUserId, partnerId, 'direct');

    // Restore draft message on mount
    useEffect(() => {
        if (state?.draft_message && !inputValue) {
            setInputValue(state.draft_message);
        }
    }, [state?.draft_message]);

    // Save draft on input change (debounced)
    const debouncedUpdateDraft = useMemo(
        () => debounce((draft: string) => {
            updateDraft(draft);
        }, 500),
        [updateDraft]
    );

    useEffect(() => {
        debouncedUpdateDraft(inputValue);
    }, [inputValue, debouncedUpdateDraft]);

    // Typing indicator for DMs
    const { typingUsernames, handleTyping } = useTypingIndicator(`dm:${[currentUserId, partnerId].sort().join('-')}`, currentUsername);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Restore scroll position on mount
    useEffect(() => {
        if (state?.scroll_position && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = state.scroll_position;
        }
    }, [state?.scroll_position]);

    // Save scroll position (debounced)
    const handleScroll = useMemo(
        () => debounce(() => {
            if (scrollContainerRef.current) {
                updateScrollPosition(scrollContainerRef.current.scrollTop);
            }
        }, 300),
        [updateScrollPosition]
    );

    // Mark messages as read when window is focused
    useEffect(() => {
        const handleFocus = () => {
            onMarkAsRead?.();
        };

        window.addEventListener('focus', handleFocus);
        // Mark as read on mount
        onMarkAsRead?.();

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [onMarkAsRead]);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSend(inputValue);
        setInputValue('');
        clearDraft(); // Clear draft from database
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
                onSend(inputValue || (data.type === 'image' ? "Sent an image" : "Sent a file"), {
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

    // Helper to get read receipt icon
    const getReadReceiptIcon = (msg: DirectMessage) => {
        if (msg.from_user_id !== currentUserId) return null;

        if (msg.read_at) {
            return <span className="text-[#0054e3] text-[10px] ml-1 font-bold" title="Read">✓✓</span>;
        } else if (msg.delivered_at) {
            return <span className="text-[#808080] text-[10px] ml-1" title="Delivered">✓✓</span>;
        } else {
            return <span className="text-[#808080] text-[10px] ml-1" title="Sent">✓</span>;
        }
    };

    return (
        <div className="im-window" style={{ position: 'absolute', left: position.x, top: position.y, zIndex: 50, filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}>
            <XPWindow
                title={`Instant Message From: ${partnerUsername}`}
                className="w-[400px] h-[380px]"
                onClose={onClose}
                icon="/icons/win95/message_envelope_open-0.png"
            >
                {/* Menu Bar */}
                <div className="flex px-2 py-0.5 bg-[#ece9d8] border-b border-[#d4d0c8] text-[11px] gap-2 text-[#444]">
                    <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer rounded-sm">File</span>
                    <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer rounded-sm">Edit</span>
                    <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer rounded-sm">Insert</span>
                    <span className="hover:bg-[#316ac5] hover:text-white px-1 cursor-pointer rounded-sm">People</span>
                </div>

                <div className="flex flex-col h-[calc(100%-25px)] p-2 bg-[#ece9d8]">
                    {/* Messages Area */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 bg-white border border-[#7f9db9] rounded-[2px] mb-2 p-3 overflow-y-auto shadow-inner text-[13px] font-['Tahoma',_sans-serif]"
                    >
                        {messages.map((msg) => {
                            const isMe = msg.from_username === currentUsername;
                            return (
                                <ContextMenu key={msg.id}>
                                    <ContextMenuTrigger>
                                        <div className={cn("mb-3 flex", isMe ? "justify-end" : "justify-start")}>
                                            <div className={cn(
                                                "max-w-[80%] rounded-lg px-3 py-2 shadow-sm relative",
                                                isMe
                                                    ? "bg-[#dbeafe] text-black border border-blue-200 rounded-tr-none"
                                                    : "bg-[#f3f4f6] text-black border border-gray-200 rounded-tl-none"
                                            )}>
                                                {!isMe && <div className="text-[10px] font-bold text-[#0054e3] mb-0.5">{msg.from_username}</div>}
                                                <div className="leading-relaxed">
                                                    <ReactMarkdown components={{ p: 'span' }}>{prepareForMarkdown(msg.message)}</ReactMarkdown>

                                                    {msg.attachment_url && (
                                                        <div className="mt-2">
                                                            {msg.attachment_type === 'image' ? (
                                                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                                                    <img src={msg.attachment_url} alt="Attachment" className="max-w-full rounded border border-black/10" />
                                                                </a>
                                                            ) : (
                                                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline bg-white p-2 rounded border border-blue-100">
                                                                    <IconPaperclip size={14} className="mr-1" />
                                                                    {msg.attachment_name || 'Attached File'}
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[9px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                                                    {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && getReadReceiptIcon(msg)}
                                                </div>
                                            </div>
                                        </div>
                                    </ContextMenuTrigger>
                                    <ContextMenuContent>
                                        <ContextMenuItem onClick={() => navigator.clipboard.writeText(msg.message)}>Copy Text</ContextMenuItem>
                                        <ContextMenuItem>Reply</ContextMenuItem>
                                        {msg.from_user_id === currentUserId && <ContextMenuItem className="text-red-500">Delete</ContextMenuItem>}
                                    </ContextMenuContent>
                                </ContextMenu>
                            );
                        })}

                        {/* Typing Indicator */}
                        {typingUsernames.includes(partnerUsername) && (
                            <div className="flex justify-start mb-2">
                                <div className="bg-gray-100 rounded-full px-3 py-1.5 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Format Bar */}
                    <div className="bg-[#ece9d8] flex items-center gap-1 mb-1 px-1">
                        <button className="p-1 hover:bg-white/50 rounded text-[#444]"><IconTextColor size={14} /></button>
                        <div className="w-[1px] h-3 bg-gray-400 mx-1" />
                        <button className="p-1 hover:bg-white/50 rounded font-bold text-[#444]"><IconBold size={14} /></button>
                        <button className="p-1 hover:bg-white/50 rounded italic text-[#444]"><IconItalic size={14} /></button>
                        <button className="p-1 hover:bg-white/50 rounded underline text-[#444]"><IconUnderline size={14} /></button>
                        <div className="w-[1px] h-3 bg-gray-400 mx-1" />
                        <span className="inline-block relative top-0.5">
                            <EmoticonPicker onSelect={(emoji) => setInputValue(prev => prev + emoji)} />
                        </span>
                        <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-white/50 rounded text-[#444]">
                            <IconPaperclip size={14} />
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border rounded-[2px] border-[#7f9db9] p-1 flex flex-col gap-2 shadow-sm relative">
                        <textarea
                            className="w-full h-16 bg-transparent p-1 font-['Tahoma',_sans-serif] text-[13px] outline-none resize-none"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                handleTyping();
                            }}
                            onKeyDown={handleKeyPress}
                            placeholder="Type a message..."
                            autoFocus
                        />
                        <div className="flex justify-between items-end border-t border-gray-100 pt-1">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <div className="text-[10px] text-gray-400 px-1 italic">
                                Press Enter to send
                            </div>
                            <XPButton onClick={handleSend} variant="primary" className="px-6 py-1 font-bold shadow-md" disabled={isUploading}>
                                {isUploading ? 'Sending...' : 'Send'}
                            </XPButton>
                        </div>
                    </div>
                </div>
            </XPWindow>
        </div>
    );
};
