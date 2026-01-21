'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { IconBell, IconMenu2, IconX } from '@tabler/icons-react';
import Image from 'next/image';

interface MobileHeaderProps {
    user?: {
        username?: string;
        display_name?: string;
        avatar_url?: string;
    };
    status?: 'online' | 'away' | 'offline';
    onMenuClick?: () => void;
    onNotificationsClick?: () => void;
    unreadCount?: number;
    className?: string;
}

/**
 * Mobile header with user profile and notifications
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
    user,
    status = 'online',
    onMenuClick,
    onNotificationsClick,
    unreadCount = 0,
    className
}) => {
    const displayName = user?.display_name || user?.username || 'Guest';
    const avatarUrl = user?.avatar_url || '/images/default-avatar.png';

    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        offline: 'bg-gray-400'
    };

    return (
        <div className={cn(
            "bg-gradient-to-r from-[#5e2b8d] via-[#7b4ea3] to-[#5e2b8d] px-4 py-3 flex items-center justify-between shadow-lg border-b border-[#4b1b7a]",
            className
        )}>
            {/* Left: Menu Button */}
            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95"
                aria-label="Menu"
            >
                <IconMenu2 size={24} className="text-white" />
            </button>

            {/* Center: User Profile */}
            <div className="flex items-center gap-2 flex-1 justify-center">
                <div className="relative">
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
                    />
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#5e2b8d]",
                        statusColors[status]
                    )} />
                </div>
                <span className="text-white font-bold text-sm truncate max-w-[150px]">
                    {displayName}
                </span>
            </div>

            {/* Right: Notifications */}
            <button
                onClick={onNotificationsClick}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors active:scale-95 relative"
                aria-label="Notifications"
            >
                <IconBell size={24} className="text-white" />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </button>
        </div>
    );
};
