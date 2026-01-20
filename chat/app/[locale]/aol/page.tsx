'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChatRoomWindow } from '@/components/aol-chat/ChatRoomWindow';
import { Win95Button } from '@/components/aol-chat/Win95Button';
import { IMWindow } from '@/components/aol-chat/IMWindow';
import { BuddyListWindow } from '@/components/aol-chat/BuddyListWindow';
import { AwayMessageModal } from '@/components/aol-chat/AwayMessageModal';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';

export default function AolChatPage() {
    const [isRoomOpen, setIsRoomOpen] = useState(false);
    const [currentRoomName, setCurrentRoomName] = useState("The Lounge");
    const [isBuddyListOpen, setIsBuddyListOpen] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [openIMs, setOpenIMs] = useState<{ userId: string; username: string }[]>([]);
    const [showAwayModal, setShowAwayModal] = useState(false);

    const supabase = createClient();
    const { activeConversations, sendMessage, markMessagesAsRead } = useDirectMessages(currentUser?.id);
    const { status, awayMessage, updateStatus } = useEnhancedPresence(currentUser?.id, currentUser?.user_metadata?.username);

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

    const handleSendIM = (partnerId: string, partnerUsername: string, text: string) => {
        sendMessage(partnerId, partnerUsername, text, currentUser?.user_metadata?.username || 'User');
    };

    return (
        <div
            className="min-h-screen w-full relative overflow-hidden font-['Tahoma',_sans-serif]"
            style={{
                background: 'linear-gradient(180deg, #245EDC 0%, #3A7BD5 50%, #1E4DB7 100%)', // XP-era blue gradient
            }}
        >
            {/* Buddy List Window */}
            {isBuddyListOpen && (
                <div className="absolute top-10 right-10 z-20">
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

            {/* Room Window */}
            {isRoomOpen && (
                <div className="absolute top-[50px] left-[50px] z-10">
                    <ChatRoomWindow
                        roomName={currentRoomName}
                        currentUser={currentUser}
                        onClose={() => setIsRoomOpen(false)}
                        onOpenIM={openIM}
                    />
                </div>
            )}

            {/* IM Windows */}
            {openIMs.map((im, index) => {
                const partnerId = im.userId;
                // Find existing conversation or create dummy
                const messages = activeConversations.get(partnerId) || [];

                // Use stored username if available, otherwise fall back to message history
                const partnerUsername = im.username || (messages[0]?.from_user_id === partnerId
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
                        position={{ x: 300 + (index * 30), y: 300 + (index * 30) }}
                    />
                );
            })}

            {/* Taskbar or simple "Rejoin" button if closed */}
            {!isRoomOpen && !isBuddyListOpen && openIMs.length === 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-50">
                    <h1 className="text-white text-2xl font-bold mb-4 shadow-black drop-shadow-md">Remrin Chat</h1>
                    <Win95Button onClick={() => setIsBuddyListOpen(true)} className="px-8 py-2 font-bold text-lg">
                        Sign On
                    </Win95Button>
                </div>
            )}
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
