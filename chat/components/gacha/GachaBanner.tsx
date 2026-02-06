"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconChevronLeft, IconChevronRight, IconDiamond, IconSparkles, IconStar, IconFlame } from "@tabler/icons-react"
import { GachaPool, GachaPoolItem, SINGLE_PULL_COST, TEN_PULL_COST, RARITY_COLORS, PityStatus } from "@/lib/hooks/use-gacha"
import { HolographicCard } from "./HolographicCard"

import { TYPOGRAPHY } from "@/lib/design-system"
import { useSFX } from "@/lib/hooks/use-sfx"

interface GachaBannerProps {
    pools: GachaPool[]
    poolItems: Record<string, GachaPoolItem[]>
    userBalance: number
    pityStatus?: PityStatus | null
    onSinglePull: (poolId: string) => void
    onTenPull: (poolId: string) => void
    onPoolChange?: (poolId: string) => void
    isPulling?: boolean
    className?: string
}

// Pity thresholds
const LEGENDARY_PITY_THRESHOLD = 90
const RARE_PITY_THRESHOLD = 10

// Pity Progress Bar Component
function PityProgressBar({
    pullsSinceLegendary,
    pullsSinceRare
}: {
    pullsSinceLegendary: number
    pullsSinceRare: number
}) {
    const legendaryProgress = Math.min((pullsSinceLegendary / LEGENDARY_PITY_THRESHOLD) * 100, 100)
    const isNearPity = pullsSinceLegendary >= LEGENDARY_PITY_THRESHOLD - 10

    return (
        <div className="w-full max-w-md mx-auto space-y-2">
            {/* Legendary Pity */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-rp-gold/80 font-medium flex items-center gap-1">
                        <IconStar size={12} />
                        Legendary Pity
                    </span>
                    <span className={cn(
                        "font-mono",
                        isNearPity ? "text-rp-gold animate-pulse font-bold" : "text-white/50"
                    )}>
                        {pullsSinceLegendary} / {LEGENDARY_PITY_THRESHOLD}
                    </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isNearPity
                                ? "bg-gradient-to-r from-rp-gold to-amber-400 animate-pulse"
                                : "bg-gradient-to-r from-rp-gold/60 to-amber-500/60"
                        )}
                        style={{
                            width: `${legendaryProgress}%`,
                            boxShadow: isNearPity ? '0 0 10px rgba(245, 158, 11, 0.6)' : 'none'
                        }}
                    />
                </div>
            </div>

            {/* Near Pity Indicator */}
            {isNearPity && (
                <div className="flex items-center justify-center gap-2 text-xs text-rp-gold animate-pulse">
                    <IconFlame size={14} />
                    <span className="font-bold">Legendary guaranteed soon!</span>
                    <IconFlame size={14} />
                </div>
            )}
        </div>
    )
}

// Animated Pull Button with glow effects
function PullButton({
    onClick,
    disabled,
    cost,
    label,
    variant = "primary",
    isPulling
}: {
    onClick: () => void
    disabled: boolean
    cost: number
    label: string
    variant?: "primary" | "premium"
    isPulling: boolean
}) {
    const [isHovered, setIsHovered] = useState(false)

    const isPremium = variant === "premium"

    return (
        <Button
            size="lg"
            disabled={disabled || isPulling}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
                "relative overflow-hidden rounded-full px-8 py-4 font-bold text-lg",
                isPremium
                    ? "bg-gradient-to-r from-rp-gold via-amber-400 to-rp-gold"
                    : "bg-gradient-to-r from-rp-iris to-rp-pine",
                "hover:opacity-90",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "text-rp-base transition-all duration-300",
                isHovered && !disabled ? "scale-105" : "scale-100",
                isPremium && !disabled && "animate-gacha-border-glow"
            )}
            style={{
                boxShadow: isHovered && !disabled
                    ? isPremium
                        ? '0 0 30px rgba(245, 158, 11, 0.5), 0 10px 40px rgba(245, 158, 11, 0.3)'
                        : '0 0 30px rgba(196, 167, 231, 0.5), 0 10px 40px rgba(196, 167, 231, 0.3)'
                    : isPremium
                        ? '0 10px 30px rgba(245, 158, 11, 0.2)'
                        : '0 10px 30px rgba(196, 167, 231, 0.2)',
                "--gacha-glow": isPremium ? "rgba(245, 158, 11, 0.6)" : "rgba(196, 167, 231, 0.6)"
            } as React.CSSProperties}
        >
            {/* Shimmer effect on hover */}
            {isHovered && !disabled && (
                <div
                    className="absolute inset-0 animate-gacha-shimmer pointer-events-none"
                    style={{
                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 60%, transparent 100%)",
                        backgroundSize: "200% 100%"
                    }}
                />
            )}

            <span className="flex items-center gap-2 relative z-10">
                {isPremium && <IconSparkles size={20} />}
                <span>{isPulling ? "Summoning..." : label}</span>
                <span className="bg-rp-base/30 flex items-center gap-1 rounded-full px-3 py-1">
                    <IconDiamond size={16} className={isPremium ? "" : "text-rp-gold"} />
                    <span className={isPremium ? "" : "text-rp-gold"}>{cost}</span>
                </span>
            </span>
        </Button>
    )
}

export function GachaBanner({
    pools,
    poolItems,
    userBalance,
    pityStatus,
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
                "bg-rp-surface/50 backdrop-blur-sm",
                "border-rp-muted/20 border",
                className
            )}>
                <IconSparkles size={48} className="text-rp-muted mb-4 animate-pulse" />
                <h3 className={`${TYPOGRAPHY.heading.h3} text-rp-subtle`}>No Active Banners</h3>
                <p className="text-rp-muted mt-1 text-sm">Check back later for new soul summons!</p>
            </div>
        )
    }

    return (
        <div className={cn("relative w-full z-10", className)}>
            {/* Section Header with subtle animation */}
            <div className="mb-8 px-6 text-center">
                <h2 className={`${TYPOGRAPHY.heading.h2} text-rp-text mb-2 inline-flex items-center gap-2`}>
                    <IconStar className="text-rp-gold animate-pulse" />
                    {currentPool.name}
                    <IconStar className="text-rp-gold animate-pulse" style={{ animationDelay: '0.5s' }} />
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-rp-surface/80 backdrop-blur-sm text-rp-iris border-2 border-rp-iris hover:bg-rp-iris hover:text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                        aria-label="Previous"
                    >
                        <IconChevronLeft size={32} />
                    </button>

                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-rp-surface/80 backdrop-blur-sm text-rp-iris border-2 border-rp-iris hover:bg-rp-iris hover:text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                        aria-label="Next"
                    >
                        <IconChevronRight size={32} />
                    </button>

                    {/* Cards Container with 3D Transform */}
                    <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center overflow-visible" style={{ transformStyle: 'preserve-3d' }}>
                        {featuredItems.map((item, index) => {
                            const diff = index - cardIndex
                            const absPos = Math.abs(diff)

                            if (absPos > 2) return null

                            const isCenter = diff === 0

                            // Premium responsive spacing
                            const baseSpacing = 160
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
                                        showName={isCenter}
                                        onClick={() => {
                                            if (!isCenter) {
                                                playClick()
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
                            {featuredItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        playClick()
                                        setCardIndex(index)
                                    }}
                                    className={cn(
                                        "h-2 rounded-full transition-all duration-300",
                                        index === cardIndex
                                            ? "w-8"
                                            : "w-2 hover:w-3"
                                    )}
                                    style={{
                                        background: index === cardIndex
                                            ? RARITY_COLORS[item.rarity].primary
                                            : 'rgba(255,255,255,0.2)',
                                        boxShadow: index === cardIndex
                                            ? `0 0 10px ${RARITY_COLORS[item.rarity].glow}`
                                            : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pity Counter */}
            {pityStatus && (
                <div className="mb-6 px-6">
                    <PityProgressBar
                        pullsSinceLegendary={pityStatus.pulls_since_legendary}
                        pullsSinceRare={pityStatus.pulls_since_rare}
                    />
                </div>
            )}

            {/* Pull Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                <PullButton
                    onClick={() => {
                        playSuccess()
                        onSinglePull(currentPool.id)
                    }}
                    disabled={!canAffordSingle}
                    cost={SINGLE_PULL_COST}
                    label="Single Pull"
                    variant="primary"
                    isPulling={isPulling}
                />

                <PullButton
                    onClick={() => {
                        playSuccess()
                        onTenPull(currentPool.id)
                    }}
                    disabled={!canAffordTen}
                    cost={TEN_PULL_COST}
                    label="10-Pull"
                    variant="premium"
                    isPulling={isPulling}
                />
            </div>

            {/* Insufficient Funds Hint */}
            {!canAffordSingle && (
                <p className="text-center text-rp-muted text-sm mt-4 animate-pulse">
                    Not enough Aether. Visit the Marketplace to get more!
                </p>
            )}
        </div>
    )
}
