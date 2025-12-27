"use client"

import { cn } from "@/lib/utils"
import { CARD } from "@/lib/design-system"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef } from "react"
import { calculateTilt, staggerDelay } from "@/lib/animations"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    IconMessageCircle,
    IconDiamond,
    IconFlame,
    IconSparkles,
    IconLock,
    IconStar,
    IconStarFilled
} from "@tabler/icons-react"

// Variant-specific configurations
const VARIANT_CONFIG = {
    character: {
        aspectRatio: "aspect-[3/4]",
        glowColor: "rgba(196, 167, 231, 0.6)", // rp-iris
        gradientFrom: "from-rp-iris/50",
        gradientTo: "to-rp-rose/50"
    },
    collection: {
        aspectRatio: "aspect-[3/4]",
        glowColor: "rgba(196, 167, 231, 0.5)",
        gradientFrom: "from-rp-iris/50",
        gradientTo: "to-rp-iris/30"
    },
    marketplace: {
        aspectRatio: "aspect-[3/4]",
        glowColor: "rgba(246, 193, 119, 0.6)", // rp-gold
        gradientFrom: "from-rp-gold/50",
        gradientTo: "to-rp-rose/50"
    }
} as const

// Rarity configurations for collection variant
const RARITY_CONFIG = {
    common: {
        border: "border-rp-muted/50",
        glow: "rgba(110, 106, 134, 0.4)",
        gradient: "from-rp-muted/50 to-rp-muted/30",
        text: "text-rp-subtle",
        stars: 1
    },
    rare: {
        border: "border-rp-pine/50",
        glow: "rgba(49, 116, 143, 0.5)",
        gradient: "from-rp-pine/50 to-rp-pine/30",
        text: "text-rp-foam",
        stars: 2
    },
    epic: {
        border: "border-rp-iris/50",
        glow: "rgba(196, 167, 231, 0.5)",
        gradient: "from-rp-iris/50 to-rp-iris/30",
        text: "text-rp-iris",
        stars: 3
    },
    legendary: {
        border: "border-rp-gold/50",
        glow: "rgba(246, 193, 119, 0.6)",
        gradient: "from-rp-gold/50 to-rp-rose/50",
        text: "text-rp-gold",
        stars: 4
    }
} as const

type Rarity = keyof typeof RARITY_CONFIG

interface BaseCardData {
    id: string
    name: string
    imageUrl?: string | null
}

interface CharacterCardData extends BaseCardData {
    category?: string | null
    categoryColor?: string | null
    totalChats?: number
}

interface CollectionCardData extends BaseCardData {
    rarity: Rarity
    isOwned: boolean
    pullCount?: number
    personaId?: string
}

interface MarketplaceCardData extends BaseCardData {
    personaId: string
    creatorName?: string
    priceAether: number
    totalSales: number
    isLimitedEdition: boolean
    quantityRemaining?: number | null
}

type CardData = CharacterCardData | CollectionCardData | MarketplaceCardData

interface UnifiedCardProps {
    variant: "character" | "collection" | "marketplace"
    data: CardData
    size?: "sm" | "md" | "lg"
    className?: string
    animationIndex?: number
    onBuyClick?: (id: string) => void
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

export function UnifiedCard({
    variant,
    data,
    size = "md",
    className,
    animationIndex = 0,
    onBuyClick
}: UnifiedCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({})
    const [isHovering, setIsHovering] = useState(false)

    const config = VARIANT_CONFIG[variant]

    // Get rarity config for collection variant
    const rarityConfig = variant === "collection"
        ? RARITY_CONFIG[(data as CollectionCardData).rarity]
        : null

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        // No tilt for locked collection cards
        if (variant === "collection" && !(data as CollectionCardData).isOwned) return

        const tiltAmount = size === "sm" ? 6 : 8
        const { rotateX, rotateY } = calculateTilt(e, tiltAmount)
        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`
        })
    }

    const handleMouseEnter = () => setIsHovering(true)

    const handleMouseLeave = () => {
        setIsHovering(false)
        setTiltStyle({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
        })
    }

    // Determine glow color
    let glowColor: string = config.glowColor
    if (variant === "character" && (data as CharacterCardData).categoryColor) {
        glowColor = (data as CharacterCardData).categoryColor || config.glowColor
    } else if (variant === "collection" && rarityConfig) {
        glowColor = rarityConfig.glow
    } else if (variant === "marketplace" && (data as MarketplaceCardData).isLimitedEdition) {
        glowColor = 'rgba(235, 111, 146, 0.6)' // rp-love for limited
    }

    // Determine if card is interactive
    const isInteractive = variant === "marketplace" ||
        (variant === "collection" && (data as CollectionCardData).isOwned) ||
        variant === "character"

    const aspectRatio = size === "sm" ? "aspect-square" : config.aspectRatio

    const cardContent = (
        <div
            ref={cardRef}
            className={cn(
                CARD.base,
                "group relative overflow-hidden",
                "animate-card-enter transition-all duration-300 ease-out",
                isInteractive && CARD.hover,
                isInteractive && CARD.interactive,
                variant === "collection" && rarityConfig && (data as CollectionCardData).isOwned && rarityConfig.border,
                className
            )}
            style={{
                ...tiltStyle,
                animationDelay: `${staggerDelay(animationIndex)}ms`,
                animationFillMode: 'both',
                boxShadow: isHovering && isInteractive
                    ? `0 20px 40px rgba(0,0,0,0.4), 0 0 40px ${glowColor}`
                    : '0 4px 20px rgba(0,0,0,0.2)',
                borderColor: isHovering && isInteractive ? glowColor : undefined,
                ['--glow-color' as string]: glowColor
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Image Container */}
            <div className={cn("relative w-full overflow-hidden", aspectRatio)}>
                {/* Image or Placeholder */}
                {data.imageUrl && (variant !== "collection" || (data as CollectionCardData).isOwned) ? (
                    <Image
                        src={data.imageUrl}
                        alt={data.name}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-500 ease-out",
                            isHovering && isInteractive ? "scale-105" : "scale-100"
                        )}
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                ) : (
                    <div className={cn(
                        "flex size-full items-center justify-center bg-gradient-to-br",
                        variant === "collection" && !(data as CollectionCardData).isOwned
                            ? "from-rp-base/80 to-rp-surface/80"
                            : `${config.gradientFrom} ${config.gradientTo}`
                    )}>
                        {variant === "collection" && !(data as CollectionCardData).isOwned ? (
                            <IconLock className="text-rp-text/20 size-10" />
                        ) : (
                            <span className="text-rp-text/50 text-4xl font-bold">
                                {data.name.slice(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="from-rp-base/90 via-rp-base/20 absolute inset-0 bg-gradient-to-t to-transparent" />

                {/* Variant-specific badges and content */}
                {variant === "character" && (
                    <>
                        {/* Chat Count Badge */}
                        {(data as CharacterCardData).totalChats !== undefined && (
                            <div className="absolute right-3 top-3">
                                <Badge className="bg-rp-base/60 flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs text-rp-rose backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2">
                                    <IconMessageCircle className="size-3" />
                                    <span>{formatCount((data as CharacterCardData).totalChats || 0)}</span>
                                </Badge>
                            </div>
                        )}
                    </>
                )}

                {variant === "collection" && (
                    <>
                        {/* Duplicate Count Badge */}
                        {(data as CollectionCardData).isOwned && (data as CollectionCardData).pullCount && (data as CollectionCardData).pullCount! > 1 && (
                            <div className="absolute right-2 top-2">
                                <Badge className="bg-rp-base/70 text-rp-text rounded-full border-0 px-2 py-0.5 text-xs font-bold backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2">
                                    ×{(data as CollectionCardData).pullCount}
                                </Badge>
                            </div>
                        )}
                    </>
                )}

                {variant === "marketplace" && (
                    <>
                        {/* Limited Edition Badge */}
                        {(data as MarketplaceCardData).isLimitedEdition && (
                            <div className="absolute left-3 top-3">
                                <Badge className="bg-rp-love/90 text-rp-base flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs font-semibold backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2">
                                    <IconSparkles className="size-3" />
                                    <span>Limited</span>
                                    {(data as MarketplaceCardData).quantityRemaining !== null && (data as MarketplaceCardData).quantityRemaining !== undefined && (
                                        <span className="text-rp-base/80 ml-1">
                                            {(data as MarketplaceCardData).quantityRemaining} left
                                        </span>
                                    )}
                                </Badge>
                            </div>
                        )}

                        {/* Sales Badge */}
                        <div className="absolute right-3 top-3">
                            <Badge className="bg-rp-base/60 text-rp-text flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2">
                                <IconFlame className="text-rp-gold size-3" />
                                <span>{formatCount((data as MarketplaceCardData).totalSales)} sold</span>
                            </Badge>
                        </div>
                    </>
                )}

                {/* Bottom Content */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                    {/* Character variant: Category badge */}
                    {variant === "character" && (data as CharacterCardData).category && (
                        <Badge
                            className={cn(
                                "mb-2 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium",
                                "transition-all duration-300 focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2",
                                isHovering && "scale-105"
                            )}
                            style={{
                                backgroundColor: (data as CharacterCardData).categoryColor
                                    ? `${(data as CharacterCardData).categoryColor}30`
                                    : "rgba(196, 167, 231, 0.3)",
                                color: (data as CharacterCardData).categoryColor || "#c4a7e7"
                            }}
                        >
                            {(data as CharacterCardData).category}
                        </Badge>
                    )}

                    {/* Collection variant: Rarity stars */}
                    {variant === "collection" && rarityConfig && (
                        <div className="mb-1 flex gap-0.5">
                            {Array.from({ length: rarityConfig.stars }).map((_, i) => (
                                <IconStarFilled
                                    key={i}
                                    className={cn(
                                        "size-3",
                                        (data as CollectionCardData).isOwned ? rarityConfig.text : "text-rp-muted"
                                    )}
                                />
                            ))}
                            {Array.from({ length: 4 - rarityConfig.stars }).map((_, i) => (
                                <IconStar
                                    key={i}
                                    className="text-rp-muted size-3"
                                />
                            ))}
                        </div>
                    )}

                    {/* Name */}
                    <h3 className={cn(
                        "font-tiempos-headline line-clamp-2 font-bold leading-tight drop-shadow-lg",
                        "transition-transform duration-300",
                        size === "sm" ? "text-sm" : "text-lg",
                        isHovering && isInteractive && "translate-x-1",
                        variant === "character" && "text-rp-text",
                        variant === "collection" && ((data as CollectionCardData).isOwned ? "text-rp-text" : "text-rp-text/40"),
                        variant === "marketplace" && "text-rp-text"
                    )}
                        style={variant === "character" ? { color: '#EB6F92' } : undefined}>
                        {variant === "collection" && !(data as CollectionCardData).isOwned ? "???" : data.name}
                    </h3>

                    {/* Collection variant: Rarity label */}
                    {variant === "collection" && rarityConfig && (
                        <p className={cn(
                            "mt-0.5 text-xs capitalize",
                            (data as CollectionCardData).isOwned ? rarityConfig.text : "text-rp-muted"
                        )}>
                            {(data as CollectionCardData).rarity}
                        </p>
                    )}

                    {/* Marketplace variant: Creator and price/buy */}
                    {variant === "marketplace" && (
                        <>
                            {(data as MarketplaceCardData).creatorName && (
                                <p className="text-rp-subtle mt-0.5 text-xs">
                                    by {(data as MarketplaceCardData).creatorName}
                                </p>
                            )}

                            {/* Price and Buy Button Row */}
                            <div className="mt-3 flex items-center justify-between">
                                {/* Price */}
                                <div className="flex items-center gap-1.5">
                                    <IconDiamond className="text-rp-gold size-5" />
                                    <span className="text-rp-gold text-lg font-bold">
                                        {(data as MarketplaceCardData).priceAether.toLocaleString()}
                                    </span>
                                    <span className="text-rp-subtle text-xs">Aether</span>
                                </div>

                                {/* Buy Button */}
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onBuyClick?.(data.id)
                                    }}
                                    className={cn(
                                        "from-rp-gold to-rp-rose text-rp-base rounded-full bg-gradient-to-r px-4 font-semibold min-h-[44px]",
                                        "hover:from-rp-gold/80 hover:to-rp-rose/80",
                                        "transition-all duration-200 hover:scale-105 active:scale-95",
                                        "focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2",
                                        isHovering && "shadow-rp-gold/30 scale-105 shadow-lg"
                                    )}
                                >
                                    Buy Now
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    // Wrap in Link for character and owned collection cards
    if (variant === "character") {
        return (
            <Link
                href={`/character/${data.id}`}
                className="block focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2 rounded-2xl"
            >
                {cardContent}
            </Link>
        )
    }

    if (variant === "collection" && (data as CollectionCardData).isOwned) {
        const personaId = (data as CollectionCardData).personaId || data.id
        return (
            <Link
                href={`/character/${personaId}`}
                className="block focus-visible:ring-2 focus-visible:ring-rp-iris focus-visible:ring-offset-2 rounded-2xl"
            >
                {cardContent}
            </Link>
        )
    }

    return cardContent
}
