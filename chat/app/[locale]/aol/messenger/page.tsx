'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BuddyListWindow } from '@/components/aol-chat/BuddyListWindow';
import { IMWindow } from '@/components/aol-chat/IMWindow';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';
import { useBuddyList } from '@/hooks/useBuddyList';
import '@/components/aol-chat/styles/yahoo-theme.css';

export default function MessengerStandalonePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [openIMs, setOpenIMs] = useState<{ userId: string; username: string }[]>([]);

    const supabase = createClient();
    const { activeConversations, sendMessage, markMessagesAsRead } = useDirectMessages(currentUser?.id);
    const { status: presenceStatus, updateStatus } = useEnhancedPresence(currentUser?.id, currentUser?.user_metadata?.username);
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
        <div className="h-screen w-full bg-[#5E2B8D] flex flex-col overflow-hidden yahoo-theme">
            <div className="flex-1 flex flex-col relative p-0">
                <BuddyListWindow
                    currentUser={currentUser}
                    onOpenIM={openIM}
                    onClose={() => window.close()}
                    currentStatus={presenceStatus}
                    onSetAway={() => {/* Handle away modal */ }}
                    isStandalone={true}
                />

                {/* IM Windows - Floating */}
                <div className="absolute inset-0 pointer-events-none">
                    {openIMs.map((im, index) => {
                        const partnerId = im.userId;
                        const messages = activeConversations.get(partnerId) || [];
                        const buddy = buddies.find(b => b.buddy_id === partnerId);
                        const partnerUsername = im.username || buddy?.buddy_username || "User";

                        return (
                            <div key={partnerId} className="pointer-events-auto">
                                <IMWindow
                                    partnerId={partnerId}
                                    partnerUsername={partnerUsername}
                                    messages={messages}
                                    currentUsername={currentUser?.user_metadata?.username || 'User'}
                                    currentUserId={currentUser?.id || ''}
                                    onSend={(text) => handleSendIM(partnerId, partnerUsername, text)}
                                    onClose={() => closeIM(partnerId)}
                                    onMarkAsRead={() => markMessagesAsRead(partnerId)}
                                    position={{ x: 50 + (index * 20), y: 50 + (index * 20) }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
