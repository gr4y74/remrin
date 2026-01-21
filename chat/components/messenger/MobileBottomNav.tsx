'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { IconHome, IconMessage, IconSparkles, IconUser } from '@tabler/icons-react';

interface MobileBottomNavProps {
    activeTab?: 'home' | 'chats' | 'discover' | 'profile';
    onTabChange?: (tab: 'home' | 'chats' | 'discover' | 'profile') => void;
    unreadChats?: number;
    className?: string;
}

/**
 * Mobile bottom navigation bar
 */
export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeTab = 'chats',
    onTabChange,
    unreadChats = 0,
    className
}) => {
    const tabs = [
        { id: 'home' as const, icon: IconHome, label: 'Home' },
        { id: 'chats' as const, icon: IconMessage, label: 'Chats', badge: unreadChats },
        { id: 'discover' as const, icon: IconSparkles, label: 'Discover' },
        { id: 'profile' as const, icon: IconUser, label: 'Profile' }
    ];

    return (
        <div className={cn(
            "bg-white border-t border-gray-200 px-2 py-2 flex items-center justify-around shadow-lg",
            className
        )}>
            {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all active:scale-95 relative min-w-[60px]",
                            isActive
                                ? "bg-[#5e2b8d]/10 text-[#5e2b8d]"
                                : "text-gray-500 hover:bg-gray-100"
                        )}
                        aria-label={tab.label}
                    >
                        <Icon size={24} className={cn(
                            "transition-colors",
                            isActive && "text-[#5e2b8d]"
                        )} />
                        <span className={cn(
                            "text-[10px] font-medium",
                            isActive && "font-bold"
                        )}>
                            {tab.label}
                        </span>

                        {/* Badge for unread count */}
                        {tab.badge && tab.badge > 0 && (
                            <div className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                                {tab.badge > 99 ? '99+' : tab.badge}
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
