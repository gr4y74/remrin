"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconChevronLeft, IconChevronRight, IconDiamond, IconSparkles, IconStar } from "@tabler/icons-react"
import { GachaPool, GachaPoolItem, SINGLE_PULL_COST, TEN_PULL_COST, RARITY_COLORS } from "@/lib/hooks/use-gacha"

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
    const [currentIndex, setCurrentIndex] = useState(0)
    const carouselRef = useRef<HTMLDivElement>(null)

    const currentPool = pools[currentIndex]
    const currentItems = currentPool ? (poolItems[currentPool.id] || []) : []
    const featuredItems = currentItems.filter(item => item.is_featured)

    // Notify parent when pool changes
    useEffect(() => {
        if (currentPool) {
            onPoolChange?.(currentPool.id)
        }
    }, [currentPool, onPoolChange])

    const goToPrevious = () => {
        setCurrentIndex(prev => (prev === 0 ? pools.length - 1 : prev - 1))
    }

    const goToNext = () => {
        setCurrentIndex(prev => (prev === pools.length - 1 ? 0 : prev + 1))
    }

    const canAffordSingle = userBalance >= SINGLE_PULL_COST
    const canAffordTen = userBalance >= TEN_PULL_COST

    if (pools.length === 0) {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center p-12 rounded-3xl",
                "bg-gradient-to-br from-white/5 to-white/[0.02]",
                "border border-white/10",
                className
            )}>
                <IconSparkles size={48} className="text-zinc-500 mb-4" />
                <h3 className="text-lg font-semibold text-zinc-400">No Active Banners</h3>
                <p className="text-sm text-zinc-500 mt-1">Check back later for new soul summons!</p>
            </div>
        )
    }

    return (
        <div className={cn("relative", className)}>
            {/* Carousel Container */}
            <div
                ref={carouselRef}
                className="relative overflow-hidden rounded-3xl"
            >
                {/* Banner Image */}
                <div className="relative aspect-[21/9] w-full overflow-hidden">
                    {currentPool.banner_image ? (
                        <Image
                            src={currentPool.banner_image}
                            alt={currentPool.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-cyan-900/50">
                            {/* Animated background when no image */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.3),transparent_70%)] animate-orb-pulse" />
                        </div>
                    )}

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

                    {/* Banner Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                        {/* Pool Name & Description */}
                        <div className="mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg mb-2">
                                {currentPool.name}
                            </h2>
                            {currentPool.description && (
                                <p className="text-sm md:text-base text-white/70 max-w-2xl">
                                    {currentPool.description}
                                </p>
                            )}
                        </div>

                        {/* Featured Characters */}
                        {featuredItems.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <IconStar size={16} className="text-amber-400" />
                                    <span className="text-sm font-medium text-amber-300">Featured Souls</span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {featuredItems.slice(0, 5).map((item) => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "relative shrink-0 size-16 md:size-20 rounded-xl overflow-hidden",
                                                "border-2 transition-all duration-300 hover:scale-105",
                                                "shadow-lg"
                                            )}
                                            style={{
                                                borderColor: RARITY_COLORS[item.rarity].primary,
                                                boxShadow: `0 0 20px ${RARITY_COLORS[item.rarity].glow}`
                                            }}
                                        >
                                            {item.persona?.image_url ? (
                                                <Image
                                                    src={item.persona.image_url}
                                                    alt={item.persona.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-full items-center justify-center bg-gradient-to-br from-purple-600/50 to-pink-600/50">
                                                    <span className="text-lg font-bold text-white/70">
                                                        {item.persona?.name?.slice(0, 2) || "??"}
                                                    </span>
                                                </div>
                                            )}
                                            <Badge
                                                className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0 rounded-full capitalize"
                                                style={{
                                                    backgroundColor: RARITY_COLORS[item.rarity].primary,
                                                    color: item.rarity === "legendary" ? "black" : "white"
                                                }}
                                            >
                                                {item.rarity}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pull Buttons */}
                        <div className="flex flex-wrap gap-3">
                            {/* Single Pull */}
                            <Button
                                size="lg"
                                disabled={!canAffordSingle || isPulling}
                                onClick={() => onSinglePull(currentPool.id)}
                                className={cn(
                                    "relative overflow-hidden rounded-full px-6 py-3 font-bold",
                                    "bg-gradient-to-r from-purple-600 to-indigo-600",
                                    "hover:from-purple-500 hover:to-indigo-500",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all duration-300 hover:scale-105",
                                    "shadow-lg shadow-purple-500/30"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <span>Single Pull</span>
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30">
                                        <IconDiamond size={14} className="text-amber-400" />
                                        <span className="text-amber-300">{SINGLE_PULL_COST}</span>
                                    </span>
                                </span>
                            </Button>

                            {/* 10-Pull */}
                            <Button
                                size="lg"
                                disabled={!canAffordTen || isPulling}
                                onClick={() => onTenPull(currentPool.id)}
                                className={cn(
                                    "relative overflow-hidden rounded-full px-6 py-3 font-bold",
                                    "bg-gradient-to-r from-amber-500 to-orange-500",
                                    "hover:from-amber-400 hover:to-orange-400",
                                    "text-black",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "transition-all duration-300 hover:scale-105",
                                    "shadow-lg shadow-amber-500/30"
                                )}
                            >
                                <span className="flex items-center gap-2">
                                    <IconSparkles size={18} />
                                    <span>10-Pull</span>
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/20">
                                        <IconDiamond size={14} />
                                        <span>{TEN_PULL_COST}</span>
                                    </span>
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {pools.length > 1 && (
                    <>
                        <button
                            onClick={goToPrevious}
                            className={cn(
                                "absolute left-4 top-1/2 -translate-y-1/2 z-10",
                                "size-10 rounded-full flex items-center justify-center",
                                "bg-black/50 backdrop-blur-sm border border-white/10",
                                "text-white hover:bg-black/70 transition-all duration-200",
                                "hover:scale-110"
                            )}
                        >
                            <IconChevronLeft size={24} />
                        </button>
                        <button
                            onClick={goToNext}
                            className={cn(
                                "absolute right-4 top-1/2 -translate-y-1/2 z-10",
                                "size-10 rounded-full flex items-center justify-center",
                                "bg-black/50 backdrop-blur-sm border border-white/10",
                                "text-white hover:bg-black/70 transition-all duration-200",
                                "hover:scale-110"
                            )}
                        >
                            <IconChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Carousel Indicators */}
            {pools.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {pools.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                index === currentIndex
                                    ? "w-8 bg-gradient-to-r from-purple-500 to-cyan-500"
                                    : "w-2 bg-white/30 hover:bg-white/50"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
