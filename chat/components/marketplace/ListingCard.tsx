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
        ? 'rgba(235, 111, 146, 0.6)' // rp-love for limited
        : 'rgba(246, 193, 119, 0.6)' // rp-gold for regular

    return (
        <div
            ref={cardRef}
            className={cn(
                "group relative overflow-hidden rounded-2xl border border-rp-muted/20 bg-rp-surface",
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
                borderColor: isHovering ? glowColor : 'rgba(110, 106, 134, 0.2)',
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
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-rp-gold/50 to-rp-rose/50">
                        <span className="text-4xl font-bold text-rp-text/50">
                            {personaName.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-rp-base/90 via-rp-base/30 to-transparent" />

                {/* Limited Edition Badge */}
                {isLimitedEdition && (
                    <div className="absolute left-3 top-3">
                        <Badge className="flex items-center gap-1 rounded-full border-0 bg-rp-love/90 px-2 py-1 text-xs font-semibold text-rp-base backdrop-blur-sm">
                            <IconSparkles className="size-3" />
                            <span>Limited</span>
                            {quantityRemaining !== null && quantityRemaining !== undefined && (
                                <span className="ml-1 text-rp-base/80">
                                    {quantityRemaining} left
                                </span>
                            )}
                        </Badge>
                    </div>
                )}

                {/* Sales Badge */}
                <div className="absolute right-3 top-3">
                    <Badge className="flex items-center gap-1 rounded-full border-0 bg-rp-base/60 px-2 py-1 text-xs text-rp-text backdrop-blur-sm">
                        <IconFlame className="size-3 text-rp-gold" />
                        <span>{formatCount(totalSales)} sold</span>
                    </Badge>
                </div>

                {/* Bottom Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Character Name */}
                    <h3 className={cn(
                        "line-clamp-1 text-lg font-bold leading-tight text-rp-text drop-shadow-lg",
                        "transition-transform duration-300",
                        isHovering && "translate-x-1"
                    )}>
                        {personaName}
                    </h3>

                    {/* Creator */}
                    {creatorName && (
                        <p className="mt-0.5 text-xs text-rp-subtle">
                            by {creatorName}
                        </p>
                    )}

                    {/* Price and Buy Button Row */}
                    <div className="mt-3 flex items-center justify-between">
                        {/* Price */}
                        <div className="flex items-center gap-1.5">
                            <IconDiamond className="size-5 text-rp-gold" />
                            <span className="text-lg font-bold text-rp-gold">
                                {priceAether.toLocaleString()}
                            </span>
                            <span className="text-xs text-rp-subtle">Aether</span>
                        </div>

                        {/* Buy Button */}
                        <Button
                            size="sm"
                            onClick={handleBuyClick}
                            className={cn(
                                "rounded-full bg-gradient-to-r from-rp-gold to-rp-rose px-4 font-semibold text-rp-base",
                                "hover:from-rp-gold/80 hover:to-rp-rose/80",
                                "transition-all duration-300",
                                isHovering && "scale-105 shadow-lg shadow-rp-gold/30"
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
