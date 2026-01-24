'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BuddyListWindow } from '@/components/aol-chat/BuddyListWindow';
import { IMWindow } from '@/components/aol-chat/IMWindow';
import { MobileLayout } from '@/components/messenger/MobileLayout';
import { MobileHeader } from '@/components/messenger/MobileHeader';
import { MobileBottomNav } from '@/components/messenger/MobileBottomNav';
import { MobileBuddyList } from '@/components/messenger/MobileBuddyList';
import { MobileChatView } from '@/components/messenger/MobileChatView';
import { MobileDiscover } from '@/components/messenger/MobileDiscover';
import { MobileProfile } from '@/components/messenger/MobileProfile';
import { MobileMenuDrawer } from '@/components/messenger/MobileMenuDrawer';
import { ServiceWorkerRegistration } from '@/components/utility/ServiceWorkerRegistration';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useEnhancedPresence } from '@/hooks/useEnhancedPresence';
import { useBuddyList, Buddy } from '@/hooks/useBuddyList';
import { useDeviceType } from '@/hooks/useMobileDetection';
import { useProfileUpdates } from '@/hooks/useUnifiedProfile';
import '@/components/aol-chat/styles/yahoo-theme.css';

type MobileView = 'buddies' | 'chat' | 'discover' | 'profile';

export default function MessengerStandalonePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [openIMs, setOpenIMs] = useState<{ userId: string; username: string }[]>([]);
    const [mobileView, setMobileView] = useState<MobileView>('buddies');
    const [activeChatPartner, setActiveChatPartner] = useState<Buddy | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const deviceType = useDeviceType();
    const isMobile = deviceType === 'mobile';

    // Initialize Supabase client once
    const [supabase] = useState(() => createClient());

    const { activeConversations, sendMessage, markMessagesAsRead } = useDirectMessages(currentUser?.id);
    const { status: presenceStatus, updateStatus } = useEnhancedPresence(currentUser?.id, currentUser?.user_metadata?.username);
    const { buddies } = useBuddyList();

    // Get all buddy user IDs for real-time profile updates
    const buddyUserIds = useMemo(() =>
        buddies.filter(b => b.buddy_type === 'human').map(b => b.buddy_id),
        [buddies]
    );

    // Subscribe to profile updates for all buddies
    const profileUpdates = useProfileUpdates(buddyUserIds);

    // Merge profile updates into buddies
    const buddiesWithUpdates = useMemo(() => {
        return buddies.map(buddy => {
            const update = profileUpdates.get(buddy.buddy_id);
            if (update && buddy.buddy_type === 'human') {
                return {
                    ...buddy,
                    avatar_url: update.avatar_url || buddy.avatar_url,
                    buddy_username: update.username || buddy.buddy_username,
                    nickname: (buddy.nickname || update.display_name || null) as string | null
                };
            }
            return buddy;
        });
    }, [buddies, profileUpdates]);

    // Fetch user session on mount and listen for auth changes
    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (mounted) {
                    setCurrentUser(session?.user || null);
                    console.log('[Messenger] Auth initialized:', session?.user?.email || 'Guest');
                }
            } catch (error) {
                console.error('[Messenger] Auth error:', error);
                if (mounted) {
                    setCurrentUser(null);
                }
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setCurrentUser(session?.user || null);
                console.log('[Messenger] Auth changed:', session?.user?.email || 'Guest');
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

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

    // Mobile: Handle buddy click
    const handleBuddyClick = (buddy: Buddy) => {
        setActiveChatPartner(buddy);
        setMobileView('chat');
        markMessagesAsRead(buddy.buddy_id);
    };

    // Mobile: Handle back from chat
    const handleBackFromChat = () => {
        setActiveChatPartner(null);
        setMobileView('buddies');
    };

    // Mobile: Handle send message
    const handleMobileSendMessage = (text: string) => {
        if (activeChatPartner) {
            handleSendIM(
                activeChatPartner.buddy_id,
                activeChatPartner.buddy_username,
                text
            );
        }
    };

    // Calculate unread messages count
    const unreadCount = useMemo(() => {
        let count = 0;
        activeConversations.forEach((messages) => {
            count += messages.filter(m => !m.read && m.to_user_id === currentUser?.id).length;
        });
        return count;
    }, [activeConversations, currentUser?.id]);

    // MOBILE LAYOUT
    if (isMobile) {
        return (
            <>
                <ServiceWorkerRegistration />
                <MobileMenuDrawer
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    user={{
                        username: currentUser?.user_metadata?.username || currentUser?.email,
                        display_name: currentUser?.user_metadata?.display_name,
                        avatar_url: currentUser?.user_metadata?.image_url || currentUser?.user_metadata?.avatar_url
                    }}
                    onLogout={async () => {
                        await supabase.auth.signOut();
                        window.location.reload();
                    }}
                />
                <MobileLayout
                    header={
                        <MobileHeader
                            user={{
                                username: currentUser?.user_metadata?.username || currentUser?.email,
                                display_name: currentUser?.user_metadata?.display_name,
                                avatar_url: currentUser?.user_metadata?.image_url || currentUser?.user_metadata?.avatar_url
                            }}
                            status={presenceStatus as any}
                            unreadCount={unreadCount}
                            onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            onNotificationsClick={() => {/* TODO: Open notifications */ }}
                        />
                    }
                    bottomNav={
                        mobileView !== 'chat' && (
                            <MobileBottomNav
                                activeTab={mobileView === 'buddies' ? 'chats' : mobileView}
                                onTabChange={(tab) => {
                                    if (tab === 'chats') setMobileView('buddies');
                                    else setMobileView(tab as MobileView);
                                }}
                                unreadChats={unreadCount}
                            />
                        )
                    }
                >
                    {mobileView === 'buddies' && (
                        <MobileBuddyList
                            buddies={buddiesWithUpdates}
                            onBuddyClick={handleBuddyClick}
                        />
                    )}

                    {mobileView === 'chat' && activeChatPartner && (
                        <MobileChatView
                            partner={{
                                id: activeChatPartner.buddy_id,
                                username: activeChatPartner.nickname || activeChatPartner.buddy_username,
                                avatar_url: activeChatPartner.avatar_url || undefined,
                                status: activeChatPartner.status as any
                            }}
                            messages={activeConversations.get(activeChatPartner.buddy_id) || []}
                            currentUserId={currentUser?.id || ''}
                            currentUsername={currentUser?.user_metadata?.username || 'User'}
                            onSendMessage={handleMobileSendMessage}
                            onBack={handleBackFromChat}
                        />
                    )}

                    {mobileView === 'discover' && (
                        <MobileDiscover
                            currentUserId={currentUser?.id}
                            onBuddyAdded={() => {
                                // Refresh buddy list when new buddy is added
                                window.location.reload();
                            }}
                        />
                    )}

                    {mobileView === 'profile' && (
                        <MobileProfile
                            user={{
                                username: currentUser?.user_metadata?.username,
                                display_name: currentUser?.user_metadata?.display_name,
                                avatar_url: currentUser?.user_metadata?.image_url
                            }}
                            onLogout={async () => {
                                await supabase.auth.signOut();
                                window.location.reload();
                            }}
                        />
                    )}                </MobileLayout>
            </>
        );
    }

    // DESKTOP LAYOUT (Original)
    return (
        <>
            <ServiceWorkerRegistration />
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
        </>
    );
}
