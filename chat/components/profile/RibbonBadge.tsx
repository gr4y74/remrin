'use client';

import { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useState } from 'react';

interface RibbonBadgeProps {
    icon: string;
    name: string;
    earnedDate: string;
    colorGradient: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    size?: 'small' | 'large';
    description?: string;
    onClick?: () => void;
}

export function RibbonBadge({
    icon,
    name,
    earnedDate,
    colorGradient,
    rarity,
    size = 'small',
    description,
    onClick
}: RibbonBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false);

    const IconComponent = (Icons as any)[icon] as LucideIcon || Icons.Award;
    const dimensions = size === 'small' ? 'w-10 h-[60px]' : 'w-[60px] h-[90px]';
    const iconSize = size === 'small' ? 'w-5 h-5' : 'w-8 h-8';

    return (
        <div
            className="relative group"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Ribbon shape */}
            <div
                className={`${dimensions} relative cursor-pointer transition-transform hover:-translate-y-1`}
                onClick={onClick}
            >
                <svg viewBox="0 0 40 60" className="absolute inset-0 w-full h-full">
                    <defs>
                        <linearGradient id={`gradient-${name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colorGradient.match(/#[0-9A-F]{6}/gi)?.[0] || '#1E88E5'} />
                            <stop offset="100%" stopColor={colorGradient.match(/#[0-9A-F]{6}/gi)?.[1] || '#1565C0'} />
                        </linearGradient>
                    </defs>
                    <path
                        d="M 0 0 L 40 0 L 40 45 L 20 60 L 0 45 Z"
                        fill={`url(#gradient-${name})`}
                        filter="drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
                    />
                </svg>

                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center pt-2">
                    <IconComponent className={`${iconSize} text-white`} />
                </div>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white px-3 py-2 rounded text-xs whitespace-nowrap z-10">
                    <div className="font-semibold">{name}</div>
                    <div className="text-rose-pine-subtle">{new Date(earnedDate).toLocaleDateString()}</div>
                </div>
            )}
        </div>
    );
}
