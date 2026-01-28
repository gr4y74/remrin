import React from 'react';
import { cn } from '@/lib/utils';
import { IconMessage, IconStar } from '@tabler/icons-react';

interface PortraitCardProps {
    image?: string;
    name: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    statusMessage?: string | null;
    isFavorite?: boolean;
    onClick?: () => void;
    className?: string;
}

/**
 * A strict portrait-mode card for AI characters.
 * Enforces 3:4 aspect ratio and specific styling to avoid regressions to circular/square layouts.
 */
export const PortraitCard: React.FC<PortraitCardProps> = ({
    image,
    name,
    status,
    statusMessage,
    isFavorite,
    onClick,
    className
}) => {
    const statusColors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
        offline: 'bg-gray-400'
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex flex-col w-full cursor-pointer transition-transform hover:scale-[1.02]",
                className
            )}
        >
            {/* Main Image Container - Enforces 3:4 Aspect Ratio */}
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-sm border border-gray-200 bg-gray-100">
                <img
                    src={image || '/images/default-avatar.png'}
                    alt={name}
                    className="w-full h-full object-cover"
                />

                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />

                {/* Top Right: Favorite Star */}
                {isFavorite && (
                    <div className="absolute top-2 right-2 text-yellow-400 drop-shadow-md">
                        <IconStar size={16} fill="currentColor" />
                    </div>
                )}

                {/* Bottom Content within the image area */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="flex items-center gap-2 mb-0.5">
                        {/* Status Indicator Dot */}
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full border border-white/50 shadow-sm",
                            statusColors[status]
                        )} />
                        <span className="font-bold text-sm truncate leading-tight">{name}</span>
                    </div>

                    {/* Status Message / Role */}
                    <div className="text-[11px] text-gray-200 truncate pl-4.5 opacity-90 font-medium">
                        {statusMessage || (status === 'offline' ? 'Offline' : 'Ready to chat')}
                    </div>
                </div>
            </div>
        </div>
    );
};
