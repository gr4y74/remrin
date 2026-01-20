'use client';

import { useState } from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { EmptyState } from './EmptyState';

/**
 * Character/Soul data structure
 */
export interface Soul {
    id: string;
    name: string;
    imageUrl?: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
    tags?: string[];
}

/**
 * Props for the CreatedSoulsGrid component
 */
interface CreatedSoulsGridProps {
    /** Array of created souls */
    souls: Soul[];
    /** Maximum number of souls to display */
    maxDisplay?: number;
    /** Whether to show the "See all" button */
    showSeeAll?: boolean;
    /** Callback when "See all" is clicked */
    onSeeAll?: () => void;
    /** Callback when a soul card is clicked */
    onSoulClick?: (soul: Soul) => void;
    /** Whether this is the user's own profile */
    isOwnProfile?: boolean;
    /** Callback when "Create Soul" is clicked */
    onCreateSoul?: () => void;
}

const rarityConfig = {
    common: { color: 'rp-subtle', glow: 'rp-subtle/20' },
    rare: { color: 'rp-foam', glow: 'rp-foam/30' },
    epic: { color: 'rp-iris', glow: 'rp-iris/40' },
    legendary: { color: 'rp-gold', glow: 'rp-gold/50' },
};

/**
 * CreatedSoulsGrid - Displays character cards in a responsive grid with hover effects
 * 
 * @example
 * ```tsx
 * <CreatedSoulsGrid 
 *   souls={userSouls}
 *   maxDisplay={6}
 *   showSeeAll={true}
 *   onSoulClick={(soul) => {}}
 * />
 * ```
 */
export function CreatedSoulsGrid({
    souls,
    maxDisplay = 6,
    showSeeAll = true,
    onSeeAll,
    onSoulClick,
    isOwnProfile = false,
    onCreateSoul,
}: CreatedSoulsGridProps) {
    const displayedSouls = souls.slice(0, maxDisplay);
    const hasMore = souls.length > maxDisplay;

    if (souls.length === 0) {
        return (
            <EmptyState
                variant="souls"
                title={isOwnProfile ? "No souls created yet" : "No souls to display"}
                description={isOwnProfile ? "Start creating your first character soul and bring them to life!" : "This user hasn't created any souls yet."}
                action={isOwnProfile && onCreateSoul ? {
                    label: "Create Your First Soul",
                    onClick: onCreateSoul,
                } : undefined}
            />
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Grid - 2 columns on mobile, touch-optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
                {displayedSouls.map((soul) => {
                    const rarity = soul.rarity || 'common';
                    const config = rarityConfig[rarity];

                    return (
                        <div
                            key={soul.id}
                            onClick={() => onSoulClick?.(soul)}
                            className={`
                                group relative 
                                bg-rp-surface rounded-lg sm:rounded-xl overflow-hidden 
                                border-2 border-rp-highlight-med
                                hover:border-${config.color}
                                transition-all duration-300
                                hover:scale-105 hover:shadow-xl hover:shadow-${config.glow}
                                active:scale-[0.98] active:opacity-90
                                cursor-pointer
                                touch-manipulation
                            `}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && onSoulClick?.(soul)}
                            aria-label={`View ${soul.name}`}
                        >
                            {/* Image */}
                            <div className="relative aspect-[3/4] w-full overflow-hidden">
                                {soul.imageUrl ? (
                                    <Image
                                        src={soul.imageUrl}
                                        alt={soul.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-rp-iris/50 to-rp-foam/50 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-rp-text/50">
                                            {soul.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-rp-base/90 via-transparent to-transparent" />

                                {/* Rarity Badge */}
                                {soul.rarity && soul.rarity !== 'common' && (
                                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full bg-${config.color}/90 backdrop-blur-sm`}>
                                        <span className="text-xs font-bold text-white uppercase">
                                            {soul.rarity}
                                        </span>
                                    </div>
                                )}

                                {/* Name */}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-sm font-semibold text-rp-text truncate">
                                        {soul.name}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* See All Button */}
            {showSeeAll && hasMore && (
                <button
                    onClick={onSeeAll}
                    className="
                        w-full py-3 px-4
                        bg-rp-surface border-2 border-rp-highlight-med
                        rounded-lg
                        text-rp-text font-medium
                        hover:border-rp-iris hover:bg-rp-overlay
                        transition-all duration-300
                        flex items-center justify-center gap-2
                        group
                    "
                >
                    <Sparkles className="w-5 h-5 text-rp-iris" aria-hidden="true" />
                    <span>See all {souls.length} souls</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}
