'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Win95Window } from './Win95Window';
import { Win95Button } from './Win95Button';
import { Win95Input } from './Win95Input';
import { DirectMessage } from '@/hooks/useDirectMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

interface IMWindowProps {
    partnerUsername: string;
    partnerId: string;
    messages: DirectMessage[];
    currentUsername: string;
    currentUserId: string;
    onSend: (message: string) => void;
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Typing indicator for DMs
    const { typingUsernames, handleTyping } = useTypingIndicator(`dm:${[currentUserId, partnerId].sort().join('-')}`, currentUsername);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
        // handleTyping(); // Optional: send stop typing event implicitly? No, API doesn't support explicit stop
        onSend(inputValue);
        setInputValue('');
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
            return <span className="text-[#0000ff] text-[10px] ml-1" title="Read">✓✓</span>;
        } else if (msg.delivered_at) {
            return <span className="text-[#808080] text-[10px] ml-1" title="Delivered">✓✓</span>;
        } else {
            return <span className="text-[#808080] text-[10px] ml-1" title="Sent">✓</span>;
        }
    };

    return (
        <div style={{ position: 'absolute', left: position.x, top: position.y, zIndex: 50 }}>
            <Win95Window
                title={`Instant Message From: ${partnerUsername}`}
                className="w-[400px] h-[350px]"
                onClose={onClose}
                icon="/icons/win95/message_envelope_open-0.png"
            >
                <div className="flex px-1 py-[2px] border-b border-[#808080] mb-1 text-[11px]">
                    <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">File</span>
                    <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">Edit</span>
                    <span className="px-2 cursor-pointer hover:bg-[#000080] hover:text-white">Insert</span>
                </div>

                <div className="flex flex-col h-[calc(100%-40px)] p-1">
                    {/* Messages Area */}
                    <div className="flex-1 bg-white border-2 border-[inset] border-[#808080] mb-1 p-2 overflow-y-auto font-['Courier_New',_monospace] text-[13px]">
                        {messages.map((msg) => (
                            <div key={msg.id} className="mb-1 flex items-start">
                                <div className="flex-1">
                                    <span className={`font-bold ${msg.from_username === currentUsername ? 'text-[#ff0000]' : 'text-[#0000ff]'}`}>
                                        {msg.from_username}:
                                    </span>{' '}
                                    <span>{msg.message}</span>
                                </div>
                                {getReadReceiptIcon(msg)}
                            </div>
                        ))}

                        {/* Typing Indicator */}
                        {typingUsernames.includes(partnerUsername) && (
                            <div className="text-[#808080] italic text-[11px] animate-pulse mt-1">
                                {partnerUsername} is typing<span className="typing-dots">...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-[#c0c0c0] p-1 border-t border-[#808080]">
                        <textarea
                            className="w-full h-16 bg-white border-2 border-[inset] border-[#808080] p-1 font-['Courier_New',_monospace] text-[12px] outline-none resize-none mb-1"
                            value={inputValue}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                handleTyping();
                            }}
                            onKeyDown={handleKeyPress}
                            autoFocus
                        />
                        <div className="flex justify-between items-center">
                            <div className="text-[10px] text-gray-600">
                                <Win95Button className="mr-1 text-[10px] px-2 py-0">A</Win95Button>
                                <Win95Button className="mr-1 text-[10px] px-2 py-0 font-bold">B</Win95Button>
                                <Win95Button className="mr-1 text-[10px] px-2 py-0 italic">I</Win95Button>
                                <Win95Button className="text-[10px] px-2 py-0 underline">U</Win95Button>
                            </div>
                            <Win95Button onClick={handleSend} className="font-bold px-6">
                                Send
                            </Win95Button>
                        </div>
                    </div>
                </div>
            </Win95Window>
        </div>
    );
};
