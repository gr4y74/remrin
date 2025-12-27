"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { calculateTilt, staggerDelay } from "@/lib/animations"
import { IconLock, IconStar, IconStarFilled } from "@tabler/icons-react"
import { Rarity, CollectionSoul } from "@/hooks/use-collection"
import { TYPOGRAPHY, SPACING } from "@/lib/design-system"

interface CollectionCardProps {
    soul: CollectionSoul
    animationIndex?: number
    showLocked?: boolean
    className?: string
}

// Rarity color configurations
const RARITY_CONFIG: Record<Rarity, {
    border: string
    glow: string
    gradient: string
    text: string
    stars: number
}> = {
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
}

export function CollectionCard({
    soul,
    animationIndex = 0,
    showLocked = true,
    className
}: CollectionCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({})
    const [isHovering, setIsHovering] = useState(false)

    const config = RARITY_CONFIG[soul.rarity]

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!soul.isOwned) return // No tilt for locked cards
        const { rotateX, rotateY } = calculateTilt(e, 6)
        setTiltStyle({
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`
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

    // Don't show locked souls if showLocked is false
    if (!soul.isOwned && !showLocked) {
        return null
    }

    const cardContent = (
        <div
            ref={cardRef}
            className={cn(
                "bg-rp-surface group relative overflow-hidden rounded-xl border-2",
                "animate-card-enter transition-all duration-300 ease-out",
                soul.isOwned ? config.border : "border-rp-muted/20",
                soul.isOwned ? "cursor-pointer" : "cursor-default",
                className
            )}
            style={{
                ...tiltStyle,
                animationDelay: `${staggerDelay(animationIndex)}ms`,
                animationFillMode: 'both',
                boxShadow: isHovering && soul.isOwned
                    ? `0 15px 30px rgba(0,0,0,0.3), 0 0 30px ${config.glow}`
                    : '0 4px 15px rgba(0,0,0,0.15)',
                borderColor: isHovering && soul.isOwned ? config.glow : undefined,
                ['--glow-color' as string]: config.glow
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Portrait */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
                {soul.isOwned && soul.imageUrl ? (
                    <Image
                        src={soul.imageUrl}
                        alt={`${soul.name} - ${soul.rarity} rarity character`}
                        fill
                        className={cn(
                            "object-cover transition-transform duration-500 ease-out",
                            isHovering ? "scale-105" : "scale-100"
                        )}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    />
                ) : (
                    // Locked/silhouette state
                    <div className={cn(
                        "flex size-full items-center justify-center",
                        soul.isOwned
                            ? `bg-gradient-to-br ${config.gradient}`
                            : "from-rp-base/80 to-rp-surface/80 bg-gradient-to-br"
                    )}>
                        {soul.isOwned ? (
                            <span className="text-rp-text/50 text-3xl font-bold">
                                {soul.name.slice(0, 2).toUpperCase()}
                            </span>
                        ) : (
                            <IconLock className="text-rp-text/20 size-10" />
                        )}
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="from-rp-base/80 via-rp-base/20 absolute inset-0 bg-gradient-to-t to-transparent" />

                {/* Duplicate Count Badge */}
                {soul.isOwned && soul.pullCount > 1 && (
                    <div className="absolute right-2 top-2">
                        <Badge className="bg-rp-base/70 text-rp-text rounded-full border-0 px-2 py-0.5 text-xs font-bold backdrop-blur-sm">
                            ×{soul.pullCount}
                        </Badge>
                    </div>
                )}

                {/* Bottom Content */}
                <div className={`absolute inset-x-0 bottom-0 ${SPACING.card.small}`}>
                    {/* Rarity Stars */}
                    <div className="mb-1 flex gap-0.5">
                        {Array.from({ length: config.stars }).map((_, i) => (
                            <IconStarFilled
                                key={i}
                                className={cn(
                                    "size-3",
                                    soul.isOwned ? config.text : "text-rp-muted"
                                )}
                            />
                        ))}
                        {Array.from({ length: 4 - config.stars }).map((_, i) => (
                            <IconStar
                                key={i}
                                className="text-rp-muted size-3"
                            />
                        ))}
                    </div>

                    {/* Name */}
                    <h3 className={cn(
                        TYPOGRAPHY.body.small,
                        "line-clamp-1 font-semibold leading-tight drop-shadow-lg",
                        "transition-transform duration-300",
                        soul.isOwned ? "text-rp-text" : "text-rp-text/40",
                        isHovering && soul.isOwned && "translate-x-0.5"
                    )}>
                        {soul.isOwned ? soul.name : "???"}
                    </h3>

                    {/* Rarity Label */}
                    <p className={cn(
                        "mt-0.5 text-xs capitalize",
                        soul.isOwned ? config.text : "text-rp-muted"
                    )}>
                        {soul.rarity}
                    </p>
                </div>
            </div>
        </div>
    )

    // Wrap in Link if owned
    if (soul.isOwned) {
        return (
            <Link href={`/character/${soul.personaId}`} className="block">
                {cardContent}
            </Link>
        )
    }

    return cardContent
}
