'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Buddy } from '@/hooks/useBuddyList';
import { IconMessage, IconStar } from '@tabler/icons-react';

interface MobileBuddyListProps {
    buddies: Buddy[];
    onBuddyClick: (buddy: Buddy) => void;
    className?: string;
}

/**
 * Mobile-optimized buddy list with touch-friendly items
 */
export const MobileBuddyList: React.FC<MobileBuddyListProps> = ({
    buddies,
    onBuddyClick,
    className
}) => {
    // Group buddies by online status
    const onlineBuddies = buddies.filter(b => b.status === 'online' || b.buddy_type === 'bot');
    const offlineBuddies = buddies.filter(b => b.status !== 'online' && b.buddy_type !== 'bot');

    const renderBuddy = (buddy: Buddy) => {
        const statusColors = {
            online: 'bg-green-500',
            away: 'bg-yellow-500',
            busy: 'bg-red-500',
            offline: 'bg-gray-400'
        };

        const displayName = buddy.nickname || buddy.buddy_username;
        const avatarUrl = buddy.avatar_url || '/images/default-avatar.png';

        return (
            <button
                key={buddy.buddy_id}
                onClick={() => onBuddyClick(buddy)}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/50 active:bg-white/70 transition-colors border-b border-gray-100 last:border-b-0"
            >
                {/* Avatar with status */}
                <div className="relative flex-shrink-0">
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white",
                        statusColors[buddy.status]
                    )} />
                </div>

                {/* Name and status */}
                <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">
                            {displayName}
                        </span>
                        {buddy.is_favorite && (
                            <IconStar size={14} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                        {buddy.status === 'away' && buddy.away_message
                            ? buddy.away_message
                            : buddy.status === 'offline' && buddy.last_seen
                                ? `Last seen ${new Date(buddy.last_seen).toLocaleDateString()}`
                                : buddy.buddy_type === 'bot'
                                    ? 'AI Character'
                                    : buddy.status.charAt(0).toUpperCase() + buddy.status.slice(1)
                        }
                    </div>
                </div>

                {/* Message icon */}
                <IconMessage size={20} className="text-[#5e2b8d] flex-shrink-0" />
            </button>
        );
    };

    return (
        <div className={cn("bg-white", className)}>
            {/* Online Section */}
            {onlineBuddies.length > 0 && (
                <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-bold text-gray-600 uppercase">
                            Online ({onlineBuddies.length})
                        </span>
                    </div>
                    <div>
                        {onlineBuddies.map(renderBuddy)}
                    </div>
                </div>
            )}

            {/* Offline Section */}
            {offlineBuddies.length > 0 && (
                <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <span className="text-xs font-bold text-gray-600 uppercase">
                            Offline ({offlineBuddies.length})
                        </span>
                    </div>
                    <div>
                        {offlineBuddies.map(renderBuddy)}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {buddies.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                    <p className="mb-2">No buddies yet</p>
                    <p className="text-sm">Add friends to start chatting!</p>
                </div>
            )}
        </div>
    );
};
