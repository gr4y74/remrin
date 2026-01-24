'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { IconArrowLeft, IconDotsVertical, IconPaperclip, IconSend } from '@tabler/icons-react';
import { useConversationState } from '@/hooks/useConversationState';
import { debounce } from 'lodash';

interface Message {
    id: string;
    from_user_id: string;
    to_user_id: string;
    from_username: string;
    to_username: string;
    message: string;
    created_at: string;
    read: boolean;
    read_by?: string[];
}

interface MobileChatViewProps {
    partner: {
        id: string;
        username: string;
        avatar_url?: string;
        status?: 'online' | 'away' | 'offline';
    };
    messages: Message[];
    currentUserId: string;
    currentUsername: string;
    onSendMessage: (text: string) => void;
    onBack: () => void;
    onOptionsClick?: () => void;
    isTyping?: boolean;
    className?: string;
}

/**
 * Mobile full-screen chat view
 */
export const MobileChatView: React.FC<MobileChatViewProps> = ({
    partner,
    messages,
    currentUserId,
    currentUsername,
    onSendMessage,
    onBack,
    onOptionsClick,
    isTyping = false,
    className
}) => {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Conversation state integration
    const { state, updateDraft, updateScrollPosition, markAsRead, clearDraft } =
        useConversationState(currentUserId, partner.id, 'direct');

    // Restore draft message on mount
    useEffect(() => {
        if (state?.draft_message && !inputText) {
            setInputText(state.draft_message);
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
        debouncedUpdateDraft(inputText);
    }, [inputText, debouncedUpdateDraft]);

    // Auto-scroll to bottom when new messages arrive
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

    // Mark messages as read when visible
    useEffect(() => {
        const unreadMessages = messages.filter(
            m => m.to_user_id === currentUserId &&
                (!m.read_by || !m.read_by.includes(currentUserId))
        );

        if (unreadMessages.length > 0) {
            const latestMessage = unreadMessages[unreadMessages.length - 1];
            markAsRead(latestMessage.id);
        }
    }, [messages, currentUserId, markAsRead]);

    const handleSend = () => {
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');
            clearDraft(); // Clear draft from database
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        offline: 'bg-gray-400'
    };

    return (
        <div className={cn("h-full flex flex-col bg-white", className)}>
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-[#5e2b8d] to-[#7b4ea3] px-4 py-3 flex items-center gap-3 shadow-md">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                    aria-label="Back"
                >
                    <IconArrowLeft size={24} className="text-white" />
                </button>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                        <img
                            src={partner.avatar_url || '/images/default-avatar.png'}
                            alt={partner.username}
                            className="w-10 h-10 rounded-full border-2 border-white/30 object-cover"
                        />
                        {partner.status && (
                            <div className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#5e2b8d]",
                                statusColors[partner.status]
                            )} />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">{partner.username}</div>
                        <div className="text-xs text-white/70">
                            {isTyping ? 'typing...' : partner.status || 'offline'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onOptionsClick}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                    aria-label="Options"
                >
                    <IconDotsVertical size={24} className="text-white" />
                </button>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#f3ebf9] to-white"
            >
                {messages.map((msg) => {
                    const isOwn = msg.from_user_id === currentUserId;

                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex",
                                isOwn ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[75%] rounded-2xl px-4 py-2 shadow-sm",
                                    isOwn
                                        ? "bg-[#5e2b8d] text-white rounded-br-sm"
                                        : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
                                )}
                            >
                                <div className="break-words whitespace-pre-wrap">{msg.message}</div>
                                <div className={cn(
                                    "text-[10px] mt-1",
                                    isOwn ? "text-white/70" : "text-gray-400"
                                )}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 flex items-end gap-2">
                <button
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors active:scale-95 flex-shrink-0"
                    aria-label="Attach file"
                >
                    <IconPaperclip size={24} />
                </button>

                <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 resize-none bg-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#5e2b8d] max-h-24 min-h-[44px]"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className={cn(
                        "p-3 rounded-full transition-all active:scale-95 flex-shrink-0",
                        inputText.trim()
                            ? "bg-[#5e2b8d] text-white shadow-lg"
                            : "bg-gray-200 text-gray-400"
                    )}
                    aria-label="Send"
                >
                    <IconSend size={20} />
                </button>
            </div>
        </div>
    );
};
