'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatRoomWindow } from '@/components/aol-chat/ChatRoomWindow';
import { XPButton } from '@/components/aol-chat/XPButton';
import { IMWindow } from '@/components/aol-chat/IMWindow';
import { BuddyListWindow } from '@/components/aol-chat/BuddyListWindow';
import { AwayMessageModal } from '@/components/aol-chat/AwayMessageModal';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';
import { useBuddyList } from '@/hooks/useBuddyList';
import { IconBrandWindows, IconMenu2, IconUser } from '@tabler/icons-react';

export default function AolChatPage() {
    const [isRoomOpen, setIsRoomOpen] = useState(false);
    const [currentRoomName, setCurrentRoomName] = useState("The Lounge");
    const [isBuddyListOpen, setIsBuddyListOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [openIMs, setOpenIMs] = useState<{ userId: string; username: string }[]>([]);
    const [showAwayModal, setShowAwayModal] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const supabase = createClient();
    const { activeConversations, sendMessage, markMessagesAsRead } = useDirectMessages(currentUser?.id);
    const { status, awayMessage, updateStatus } = useEnhancedPresence(currentUser?.id, currentUser?.user_metadata?.username);
    const { buddies } = useBuddyList();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        getUser();
    }, []);

    const openIM = (userId: string, username: string) => {
        if (!openIMs.find(im => im.userId === userId)) {
            setOpenIMs(prev => [...prev, { userId, username }]);
        }
    };

    const closeIM = (partnerId: string) => {
        setOpenIMs(prev => prev.filter(im => im.userId !== partnerId));
    };

    const handleSendIM = (partnerId: string, partnerUsername: string, text: string, attachment?: any) => {
        const buddy = buddies.find(b => b.buddy_id === partnerId);
        const isBot = buddy?.buddy_type === 'bot';
        sendMessage(partnerId, partnerUsername, text, currentUser?.user_metadata?.username || 'User', attachment, isBot);
    };

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden font-['Tahoma',_sans-serif] bg-[#f3ebf9] yahoo-theme">
            {/* XP/AOL Style Header Toolbar */}
            <div className="h-10 bg-gradient-to-r from-[#5e2b8d] via-[#7b4ea3] to-[#5e2b8d] flex items-center justify-between px-2 shadow-md z-50 border-b border-[#4b1b7a]">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center border border-white/30 text-white">
                            <IconBrandWindows size={16} />
                        </div>
                        <span className="text-white font-bold tracking-wide drop-shadow-md text-lg italic">Remrin Messenger</span>
                    </div>

                    <div className="flex gap-1 ml-4 text-white/90 text-sm">
                        <button className="px-3 py-1 hover:bg-white/10 rounded transition-colors">File</button>
                        <button className="px-3 py-1 hover:bg-white/10 rounded transition-colors">Edit</button>
                        <button className="px-3 py-1 hover:bg-white/10 rounded transition-colors">Window</button>
                        <button className="px-3 py-1 hover:bg-white/10 rounded transition-colors">Sign Off</button>
                        <button className="px-3 py-1 hover:bg-white/10 rounded transition-colors">Help</button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-white text-xs bg-black/20 px-2 py-1 rounded border border-white/10 shadow-inner flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-green-400' : 'bg-yellow-400'} shadow-[0_0_5px_rgba(255,255,255,0.5)]`} />
                        {currentUser?.user_metadata?.username || 'Guest'}
                    </div>
                </div>
            </div>

            {/* Main App Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Sidebar: Buddy List */}
                <div
                    className={`transition-all duration-300 ease-in-out border-r border-[#d8c3e8] bg-[#f3ebf9] flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.1)] z-40 ${sidebarCollapsed ? 'w-10' : 'w-[260px]'}`}
                >
                    <div className="flex justify-end p-1 bg-[#d8c3e8] border-b border-[#ffffff]">
                        <button
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className="p-1 hover:bg-white/50 rounded text-gray-600"
                            title={sidebarCollapsed ? "Expand Buddy List" : "Collapse Buddy List"}
                        >
                            <IconMenu2 size={14} />
                        </button>
                    </div>

                    {!sidebarCollapsed && (
                        <div className="flex-1 overflow-hidden p-2">
                            {/* Buddy List Window embedded in sidebar */}
                            <BuddyListWindow
                                currentUser={currentUser}
                                onOpenIM={openIM}
                                onClose={() => setIsBuddyListOpen(false)}
                                currentStatus={status}
                                onSetAway={() => setShowAwayModal(true)}
                                onJoinRoom={() => {
                                    const room = prompt("Enter room name to join:", "The Lounge");
                                    if (room) {
                                        setCurrentRoomName(room);
                                        setIsRoomOpen(true);
                                    }
                                }}
                            />
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="flex-1 flex flex-col items-center gap-4 py-4">
                            <button className="p-2 bg-white rounded shadow border border-gray-300 hover:bg-blue-50 text-blue-600" title="Buddy List" onClick={() => setSidebarCollapsed(false)}>
                                <IconUser size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Center / Workspace */}
                <div className="flex-1 relative bg-[#5770A7] p-4 flex items-center justify-center overflow-auto"
                    style={{
                        backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-[#5770A7]/30 backdrop-blur-[1px]" />

                    {/* Room Window */}
                    {isRoomOpen ? (
                        <div className="z-10 w-full max-w-5xl h-[90%] animate-in fade-in zoom-in duration-300">
                            <ChatRoomWindow
                                roomName={currentRoomName}
                                currentUser={currentUser}
                                onClose={() => setIsRoomOpen(false)}
                                onOpenIM={openIM}
                            />
                        </div>
                    ) : (
                        <div className="z-0 text-center text-white drop-shadow-md">
                            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
                                <span className="inline-block p-3 bg-white/20 rounded-xl border border-white/30 backdrop-blur-md">👋</span>
                                Welcome to Remrin
                            </h1>
                            <p className="text-xl mb-8 opacity-90">Select a buddy to chat or join a room.</p>
                            <XPButton
                                onClick={() => setIsRoomOpen(true)}
                                variant="primary"
                                className="px-8 py-3 text-sm font-bold shadow-lg scale-110 hover:scale-125 transition-transform"
                            >
                                Join Public Lounge
                            </XPButton>
                        </div>
                    )}

                    {/* IM Windows - Floating over workspace */}
                    {openIMs.map((im, index) => {
                        const partnerId = im.userId;
                        const messages = activeConversations.get(partnerId) || [];
                        const buddy = buddies.find(b => b.buddy_id === partnerId);
                        const partnerUsername = im.username || buddy?.buddy_username || (messages[0]?.from_user_id === partnerId
                            ? messages[0].from_username
                            : messages[0]?.to_username || "Unknown User");

                        return (
                            <IMWindow
                                key={partnerId}
                                partnerId={partnerId}
                                partnerUsername={partnerUsername}
                                messages={messages}
                                currentUsername={currentUser?.user_metadata?.username || 'User'}
                                currentUserId={currentUser?.id || ''}
                                onSend={(text) => handleSendIM(partnerId, partnerUsername, text)}
                                onClose={() => closeIM(partnerId)}
                                onMarkAsRead={() => markMessagesAsRead(partnerId)}
                                position={{ x: 100 + (index * 40), y: 100 + (index * 40) }}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Away Modal */}
            {showAwayModal && (
                <AwayMessageModal
                    initialMessage={awayMessage}
                    onClose={() => setShowAwayModal(false)}
                    onSave={(msg) => updateStatus('away', msg)}
                />
            )}
        </div>
    );
}
