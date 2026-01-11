'use client';

import { LucideIcon } from 'lucide-react';
import { Inbox, Users, Heart, MessageCircle, Sparkles } from 'lucide-react';

/**
 * Props for the EmptyState component
 */
interface EmptyStateProps {
    /** Icon to display */
    icon?: LucideIcon;
    /** Variant determines the preset icon and styling */
    variant?: 'posts' | 'followers' | 'following' | 'likes' | 'souls' | 'custom';
    /** Title text */
    title: string;
    /** Description text */
    description?: string;
    /** Optional action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Optional secondary action */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

const variantConfig = {
    posts: { icon: Inbox, color: 'rp-iris' },
    followers: { icon: Users, color: 'rp-foam' },
    following: { icon: Users, color: 'rp-love' },
    likes: { icon: Heart, color: 'rp-rose' },
    souls: { icon: Sparkles, color: 'rp-gold' },
    custom: { icon: MessageCircle, color: 'rp-subtle' },
};

/**
 * EmptyState - Displays a friendly empty state with icon, message, and optional actions
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   variant="souls"
 *   title="No souls created yet"
 *   description="Start creating your first character soul!"
 *   action={{ label: "Create Soul", onClick: () => {} }}
 * />
 * ```
 */
export function EmptyState({
    icon,
    variant = 'custom',
    title,
    description,
    action,
    secondaryAction,
}: EmptyStateProps) {
    const config = variantConfig[variant];
    const Icon = icon || config.icon;
    const color = config.color;

    return (
        <div
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
            role="status"
            aria-label={title}
        >
            {/* Icon */}
            <div
                className={`
                    w-20 h-20 rounded-full 
                    bg-${color}/10 
                    flex items-center justify-center 
                    mb-6
                    animate-pulse
                `}
            >
                <Icon
                    className={`w-10 h-10 text-${color}`}
                    aria-hidden="true"
                />
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-rp-text mb-2">
                {title}
            </h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-rp-subtle max-w-md mb-6">
                    {description}
                </p>
            )}

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        <button
                            onClick={action.onClick}
                            className={`
                                px-6 py-2.5 
                                bg-${color} 
                                text-white 
                                rounded-lg 
                                font-medium 
                                hover:opacity-90 
                                transition-all 
                                duration-200
                                hover:scale-105
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-${color} 
                                focus:ring-offset-2 
                                focus:ring-offset-rp-base
                            `}
                        >
                            {action.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="
                                px-6 py-2.5 
                                border-2 
                                border-rp-subtle 
                                text-rp-text 
                                rounded-lg 
                                font-medium 
                                hover:bg-rp-overlay 
                                transition-all 
                                duration-200
                                focus:outline-none 
                                focus:ring-2 
                                focus:ring-rp-subtle 
                                focus:ring-offset-2 
                                focus:ring-offset-rp-base
                            "
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
