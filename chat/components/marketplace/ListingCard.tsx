"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { calculateTilt, staggerDelay } from "@/lib/animations"
import { IconDiamond, IconFlame, IconSparkles } from "@tabler/icons-react"

interface ListingCardProps {
    id: string
    personaId: string
    personaName: string
    personaImage: string | null
    creatorId: string
    creatorName?: string
    priceAether: number
    totalSales: number
    isLimitedEdition: boolean
    quantityRemaining?: number | null
    className?: string
    animationIndex?: number
    onBuyClick?: (listingId: string) => void
}

// Format large numbers: 12500 -> "12.5K"
function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
}

export function ListingCard({
    id,
    personaId,
    personaName,
    personaImage,
    creatorId,
    creatorName,
    priceAether,
    totalSales,
    isLimitedEdition,
    quantityRemaining,
    className,
    animationIndex = 0,
    onBuyClick
}: ListingCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({})
    const [isHovering, setIsHovering] = useState(false)

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { rotateX, rotateY } = calculateTilt(e, 8)
        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
        })
    }

    const handleMouseEnter = () => {
        setIsHovering(true)
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
        })
    }

    const handleBuyClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onBuyClick?.(id)
    }

    // Gold/amber glow for marketplace cards
    const glowColor = isLimitedEdition
        ? 'rgba(239, 68, 68, 0.6)' // Red for limited
        : 'rgba(245, 158, 11, 0.6)' // Amber for regular

    return (
        <div
            ref={cardRef}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5",
                "transition-all duration-300 ease-out animate-card-enter",
                className
            )}
            style={{
                ...tiltStyle,
                animationDelay: `${staggerDelay(animationIndex)}ms`,
                animationFillMode: 'both',
                boxShadow: isHovering
                    ? `0 20px 40px rgba(0,0,0,0.4), 0 0 40px ${glowColor}`
                    : '0 4px 20px rgba(0,0,0,0.2)',
                borderColor: isHovering ? glowColor : 'rgba(255,255,255,0.05)',
                ['--glow-color' as string]: glowColor
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Portrait Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
                {personaImage ? (
                    <Image
                        src={personaImage}
                        alt={personaName}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-500 ease-out",
                            isHovering ? "scale-105" : "scale-100"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-amber-600/50 to-orange-500/50">
                        <span className="text-4xl font-bold text-white/50">
                            {personaName.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Limited Edition Badge */}
                {isLimitedEdition && (
                    <div className="absolute left-3 top-3">
                        <Badge className="flex items-center gap-1 rounded-full border-0 bg-red-500/90 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                            <IconSparkles className="size-3" />
                            <span>Limited</span>
                            {quantityRemaining !== null && quantityRemaining !== undefined && (
                                <span className="ml-1 text-white/80">
                                    {quantityRemaining} left
                                </span>
                            )}
                        </Badge>
                    </div>
                )}

                {/* Sales Badge */}
                <div className="absolute right-3 top-3">
                    <Badge className="flex items-center gap-1 rounded-full border-0 bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm">
                        <IconFlame className="size-3 text-orange-400" />
                        <span>{formatCount(totalSales)} sold</span>
                    </Badge>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Character Name */}
                    <h3 className={cn(
                        "line-clamp-1 text-lg font-bold leading-tight text-white drop-shadow-lg",
                        "transition-transform duration-300",
                        isHovering && "translate-x-1"
                    )}>
                        {personaName}
                    </h3>

                    {/* Creator */}
                    {creatorName && (
                        <p className="mt-0.5 text-xs text-white/60">
                            by {creatorName}
                        </p>
                    )}

                    {/* Price and Buy Button Row */}
                    <div className="mt-3 flex items-center justify-between">
                        {/* Price */}
                        <div className="flex items-center gap-1.5">
                            <IconDiamond className="size-5 text-amber-400" />
                            <span className="text-lg font-bold text-amber-400">
                                {priceAether.toLocaleString()}
                            </span>
                            <span className="text-xs text-white/50">Aether</span>
                        </div>

                        {/* Buy Button */}
                        <Button
                            size="sm"
                            onClick={handleBuyClick}
                            className={cn(
                                "rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 font-semibold text-white",
                                "hover:from-amber-400 hover:to-orange-400",
                                "transition-all duration-300",
                                isHovering && "scale-105 shadow-lg shadow-amber-500/30"
                            )}
                        >
                            Buy Now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
