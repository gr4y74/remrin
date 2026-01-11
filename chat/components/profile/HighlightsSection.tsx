'use client';

import { useState } from 'react';
import { Star, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { EmptyState } from './EmptyState';

/**
 * Highlight item structure
 */
export interface Highlight {
    id: string;
    type: 'post' | 'achievement' | 'media';
    title: string;
    description?: string;
    imageUrl?: string;
    date: string;
}

/**
 * Props for the HighlightsSection component
 */
interface HighlightsSectionProps {
    /** Array of highlights */
    highlights: Highlight[];
    /** Whether this is the user's own profile */
    isOwnProfile?: boolean;
    /** Whether edit mode is enabled */
    isEditMode?: boolean;
    /** Callback when adding a highlight */
    onAddHighlight?: () => void;
    /** Callback when removing a highlight */
    onRemoveHighlight?: (id: string) => void;
    /** Callback when a highlight is clicked */
    onHighlightClick?: (highlight: Highlight) => void;
}

/**
 * HighlightsSection - Carousel/grid of pinned posts and achievements
 * 
 * @example
 * ```tsx
 * <HighlightsSection 
 *   highlights={userHighlights}
 *   isOwnProfile={true}
 *   isEditMode={false}
 *   onAddHighlight={() => {}}
 *   onRemoveHighlight={(id) => {}}
 * />
 * ```
 */
export function HighlightsSection({
    highlights,
    isOwnProfile = false,
    isEditMode = false,
    onAddHighlight,
    onRemoveHighlight,
    onHighlightClick,
}: HighlightsSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? highlights.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === highlights.length - 1 ? 0 : prev + 1));
    };

    if (highlights.length === 0) {
        return (
            <div className="bg-rp-surface rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-rp-text flex items-center gap-2">
                        <Star className="w-5 h-5 text-rp-gold" aria-hidden="true" />
                        Highlights
                    </h2>
                </div>
                <EmptyState
                    variant="custom"
                    icon={Star}
                    title={isOwnProfile ? "No highlights yet" : "No highlights to show"}
                    description={isOwnProfile ? "Pin your best posts and achievements to showcase them here!" : undefined}
                    action={isOwnProfile && onAddHighlight ? {
                        label: "Add Highlight",
                        onClick: onAddHighlight,
                    } : undefined}
                />
            </div>
        );
    }

    const currentHighlight = highlights[currentIndex];

    return (
        <div className="bg-rp-surface rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-rp-text flex items-center gap-2">
                    <Star className="w-5 h-5 text-rp-gold" aria-hidden="true" />
                    Highlights
                </h2>
                {isOwnProfile && isEditMode && onAddHighlight && (
                    <button
                        onClick={onAddHighlight}
                        className="p-2 bg-rp-iris text-white rounded-lg hover:bg-rp-iris/90 transition-colors"
                        aria-label="Add highlight"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Carousel */}
            <div className="relative">
                {/* Main Highlight */}
                <div
                    className="relative group cursor-pointer"
                    onClick={() => onHighlightClick?.(currentHighlight)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onHighlightClick?.(currentHighlight)}
                >
                    {/* Image */}
                    {currentHighlight.imageUrl && (
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-4">
                            <Image
                                src={currentHighlight.imageUrl}
                                alt={currentHighlight.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-rp-base/80 via-transparent to-transparent" />
                        </div>
                    )}

                    {/* Content */}
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold text-rp-text group-hover:text-rp-iris transition-colors">
                                {currentHighlight.title}
                            </h3>
                            {isEditMode && onRemoveHighlight && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveHighlight(currentHighlight.id);
                                    }}
                                    className="p-1.5 bg-rp-love/10 text-rp-love rounded-lg hover:bg-rp-love/20 transition-colors"
                                    aria-label="Remove highlight"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        {currentHighlight.description && (
                            <p className="text-sm text-rp-subtle line-clamp-2">
                                {currentHighlight.description}
                            </p>
                        )}
                        <p className="text-xs text-rp-muted">
                            {new Date(currentHighlight.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {highlights.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 bg-rp-base/90 backdrop-blur-sm border border-rp-highlight-med rounded-full hover:bg-rp-overlay transition-all hover:scale-110"
                            aria-label="Previous highlight"
                        >
                            <ChevronLeft className="w-5 h-5 text-rp-text" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 bg-rp-base/90 backdrop-blur-sm border border-rp-highlight-med rounded-full hover:bg-rp-overlay transition-all hover:scale-110"
                            aria-label="Next highlight"
                        >
                            <ChevronRight className="w-5 h-5 text-rp-text" />
                        </button>
                    </>
                )}
            </div>

            {/* Dots Indicator */}
            {highlights.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    {highlights.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`
                                h-2 rounded-full transition-all duration-300
                                ${index === currentIndex
                                    ? 'w-8 bg-rp-iris'
                                    : 'w-2 bg-rp-muted hover:bg-rp-subtle'
                                }
                            `}
                            aria-label={`Go to highlight ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
