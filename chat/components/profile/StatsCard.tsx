'use client';

import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Props for the StatsCard component
 */
interface StatsCardProps {
    /** Icon component to display */
    icon: LucideIcon;
    /** Numeric value to display */
    value: number;
    /** Label text describing the stat */
    label: string;
    /** Optional trend percentage (positive or negative) */
    trend?: number;
    /** Optional color variant for the card */
    variant?: 'default' | 'love' | 'gold' | 'iris' | 'foam';
    /** Optional click handler */
    onClick?: () => void;
}

const variantStyles = {
    default: 'hover:border-rp-iris',
    love: 'hover:border-rp-love',
    gold: 'hover:border-rp-gold',
    iris: 'hover:border-rp-iris',
    foam: 'hover:border-rp-foam',
};

const iconVariantStyles = {
    default: 'text-rp-iris',
    love: 'text-rp-love',
    gold: 'text-rp-gold',
    iris: 'text-rp-iris',
    foam: 'text-rp-foam',
};

/**
 * StatsCard - Displays a statistic with an icon, animated counter, and optional trend
 * 
 * @example
 * ```tsx
 * <StatsCard 
 *   icon={Users} 
 *   value={1234} 
 *   label="Followers" 
 *   trend={12.5}
 *   variant="love"
 * />
 * ```
 */
export function StatsCard({
    icon: Icon,
    value,
    label,
    trend,
    variant = 'default',
    onClick
}: StatsCardProps) {
    const [displayValue, setDisplayValue] = useState(0);

    // Animated counter effect
    useEffect(() => {
        const duration = 1000; // 1 second
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div
            className={`
                bg-rp-surface rounded-lg p-4 
                ${variantStyles[variant]} 
                transition-all duration-300 
                hover:shadow-lg hover:shadow-${variant === 'default' ? 'rp-iris' : `rp-${variant}`}/10
                ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
            `}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
        >
            <div className="flex items-center gap-3">
                <div className={`${iconVariantStyles[variant]} transition-transform duration-300 hover:scale-110`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold text-rp-text tabular-nums">
                            {displayValue.toLocaleString()}
                        </div>
                        {trend !== undefined && (
                            <span
                                className={`text-xs font-medium ${trend > 0 ? 'text-rp-foam' : trend < 0 ? 'text-rp-love' : 'text-rp-subtle'
                                    }`}
                                aria-label={`${trend > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(trend)}%`}
                            >
                                {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-rp-subtle mt-0.5">{label}</div>
                </div>
            </div>
        </div>
    );
}
