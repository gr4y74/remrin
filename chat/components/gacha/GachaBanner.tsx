"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconChevronLeft, IconChevronRight, IconDiamond, IconSparkles, IconStar } from "@tabler/icons-react"
import { GachaPool, GachaPoolItem, SINGLE_PULL_COST, TEN_PULL_COST, RARITY_COLORS } from "@/lib/hooks/use-gacha"
import { HolographicCard } from "./HolographicCard"

import { TYPOGRAPHY } from "@/lib/design-system"
import { useSFX } from "@/lib/hooks/use-sfx"

interface GachaBannerProps {
    pools: GachaPool[]
    poolItems: Record<string, GachaPoolItem[]>
    userBalance: number
    onSinglePull: (poolId: string) => void
    onTenPull: (poolId: string) => void
    onPoolChange?: (poolId: string) => void
    isPulling?: boolean
    className?: string
}

export function GachaBanner({
    pools,
    poolItems,
    userBalance,
    onSinglePull,
    onTenPull,
    onPoolChange,
    isPulling = false,
    className
}: GachaBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0) // Pool index
    const [cardIndex, setCardIndex] = useState(0) // Card carousel index

    const carouselRef = useRef<HTMLDivElement>(null)
    const { playClick, playHover, playSuccess } = useSFX()

    const currentPool = pools[currentIndex]
    const currentItems = currentPool ? (poolItems[currentPool.id] || []) : []
    const featuredItems = currentItems.filter(item => item.is_featured)

    // Initialize card index to center when pool or items change
    useEffect(() => {
        setCardIndex(Math.floor(featuredItems.length / 2))
    }, [currentPool, featuredItems.length])

    // Notify parent when pool changes
    useEffect(() => {
        if (currentPool) {
            onPoolChange?.(currentPool.id)
        }
    }, [currentPool, onPoolChange])

    const goToPrevious = () => {
        playClick()
        setCardIndex(prev => (prev === 0 ? featuredItems.length - 1 : prev - 1))
    }

    const goToNext = () => {
        playClick()
        setCardIndex(prev => (prev === featuredItems.length - 1 ? 0 : prev + 1))
    }

    const canAffordSingle = userBalance >= SINGLE_PULL_COST
    const canAffordTen = userBalance >= TEN_PULL_COST

    if (pools.length === 0) {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center rounded-3xl p-12",
                "bg-rp-surface",
                "border-rp-muted/20 border",
                className
            )}>
                <IconSparkles size={48} className="text-rp-muted mb-4" />
                <h3 className={`${TYPOGRAPHY.heading.h3} text-rp-subtle`}>No Active Banners</h3>
                <p className="text-rp-muted mt-1 text-sm">Check back later for new soul summons!</p>
            </div>
        )
    }

    return (
        <div className={cn("relative w-full", className)}>
            {/* Section Header */}
            <div className="mb-8 px-6 text-center">
                <h2 className={`${TYPOGRAPHY.heading.h2} text-rp-text mb-2 inline-flex items-center gap-2`}>
                    <IconStar className="text-rp-gold" />
                    {currentPool.name}
                    <IconStar className="text-rp-gold" />
                </h2>
                {currentPool.description && (
                    <p className="text-rp-text/70 max-w-2xl mx-auto text-sm md:text-base mt-2">
                        {currentPool.description}
                    </p>
                )}
            </div>

            {/* 3D Carousel with Holographic Cards - Full Width */}
            <div className="w-full py-8 px-4 md:px-8">
                <div className="relative" style={{ perspective: '2000px' }}>
                    {/* Navigation Buttons */}
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-rp-surface text-rp-iris border-2 border-rp-iris hover:bg-rp-iris hover:text-white rounded-full flex items-center justify-center transition-all"
                        aria-label="Previous"
                    >
                        <IconChevronLeft size={32} />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-rp-surface text-rp-iris border-2 border-rp-iris hover:bg-rp-iris hover:text-white rounded-full flex items-center justify-center transition-all"
                        aria-label="Next"
                    >
                        <IconChevronRight size={32} />
                    </button>

                    {/* Cards Container with 3D Transform - Responsive (Matches Home Page h-[600px] on Desktop) */}
                    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
                        {featuredItems.map((item, index) => {
                            const diff = index - cardIndex
                            const absPos = Math.abs(diff)

                            if (absPos > 2) return null

                            const isCenter = diff === 0

                            // Premium responsive spacing to prevent cutoff
                            const baseSpacing = 160 // mobile
                            const spacing = diff * baseSpacing

                            const cardStyle = {
                                transform: isCenter
                                    ? 'translateX(0) translateZ(0) scale(1)'
                                    : `translateX(calc(${spacing}px + ${diff * 60}px * ((100vw - 640px) / (1024px - 640px)))) translateZ(-${absPos * 200}px) scale(${1 - absPos * 0.15})`,
                                opacity: isCenter ? 1 : 1 - absPos * 0.3,
                                zIndex: isCenter ? 3 : 3 - absPos
                            }

                            return (
                                <div
                                    key={item.id}
                                    className="absolute transition-all duration-500 ease-out"
                                    style={cardStyle}
                                >
                                    <HolographicCard
                                        imageUrl={item.persona?.image_url || "/images/placeholder-soul.png"}
                                        name={item.persona?.name || "Unknown Soul"}
                                        rarity={item.rarity}
                                        className="w-[220px] h-[320px] sm:w-[260px] sm:h-[380px] md:w-[300px] md:h-[440px] lg:w-[320px] lg:h-[480px]"
                                        showBadge={true}
                                        onClick={() => {
                                            if (!isCenter) {
                                                setCardIndex(index)
                                            }
                                        }}
                                    />
                                </div>
                            )
                        })}
                    </div>

                    {/* Pool Indicators */}
                    {featuredItems.length > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            {featuredItems.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCardIndex(index)}
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-300",
                                        index === cardIndex
                                            ? "from-rp-iris to-rp-foam w-8 bg-gradient-to-r"
                                            : "bg-rp-muted/30 hover:bg-rp-muted/50 w-2"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pull Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
                {/* Single Pull */}
                <Button
                    size="lg"
                    disabled={!canAffordSingle || isPulling}
                    onClick={() => {
                        playSuccess()
                        onSinglePull(currentPool.id)
                    }}
                    className={cn(
                        "relative overflow-hidden rounded-full px-8 py-4 font-bold text-lg",
                        "from-rp-iris to-rp-pine bg-gradient-to-r",
                        "hover:opacity-90",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "text-rp-base transition-all duration-300 hover:scale-105",
                        "shadow-rp-iris/30 shadow-lg"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <span>Single Pull</span>
                        <span className="bg-rp-base/30 flex items-center gap-1 rounded-full px-3 py-1">
                            <IconDiamond size={16} className="text-rp-gold" />
                            <span className="text-rp-gold">{SINGLE_PULL_COST}</span>
                        </span>
                    </span>
                </Button>

                {/* 10-Pull */}
                <Button
                    size="lg"
                    disabled={!canAffordTen || isPulling}
                    onClick={() => {
                        playSuccess()
                        onTenPull(currentPool.id)
                    }}
                    className={cn(
                        "relative overflow-hidden rounded-full px-8 py-4 font-bold text-lg",
                        "from-rp-gold to-rp-rose bg-gradient-to-r",
                        "hover:opacity-90",
                        "text-rp-base",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "transition-all duration-300 hover:scale-105",
                        "shadow-rp-gold/30 shadow-lg"
                    )}
                >
                    <span className="flex items-center gap-2">
                        <IconSparkles size={20} />
                        <span>10-Pull</span>
                        <span className="bg-rp-base/20 flex items-center gap-1 rounded-full px-3 py-1">
                            <IconDiamond size={16} />
                            <span>{TEN_PULL_COST}</span>
                        </span>
                    </span>
                </Button>
            </div>
        </div>
    )
}
