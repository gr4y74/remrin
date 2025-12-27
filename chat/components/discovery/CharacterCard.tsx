"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { calculateTilt, staggerDelay } from "@/lib/animations"

interface CharacterCardProps {
    id: string
    name: string
    imageUrl: string | null
    category: string | null
    categoryColor?: string | null
    totalChats: number
    className?: string
    animationIndex?: number
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

export function CharacterCard({
    id,
    name,
    imageUrl,
    category,
    categoryColor,
    totalChats,
    className,
    animationIndex = 0
}: CharacterCardProps) {
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

    // Glow color based on category
    const glowColor = categoryColor || 'rgba(196, 167, 231, 0.6)' // rp-iris default

    return (
        <Link href={`/character/${id}`} className="block">
            <div
                ref={cardRef}
                className={cn(
                    "border-rp-muted/20 bg-rp-surface group relative overflow-hidden rounded-2xl border",
                    "animate-card-enter transition-all duration-300 ease-out",
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
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={name}
                            fill
                            className={cn(
                                "object-cover transition-transform duration-500 ease-out",
                                isHovering ? "scale-105" : "scale-100"
                            )}
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="from-rp-iris/50 to-rp-foam/50 flex size-full items-center justify-center bg-gradient-to-br">
                            <span className="text-rp-text/50 text-4xl font-bold">
                                {name.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="from-rp-base/90 via-rp-base/20 absolute inset-0 bg-gradient-to-t to-transparent" />

                    {/* Stats Badge */}
                    <div className="absolute right-3 top-3">
                        <Badge className="bg-rp-base/60 flex items-center gap-1 rounded-full border-0 px-2 py-1 text-xs backdrop-blur-sm" style={{ color: '#BE8E95' }}>
                            <MessageCircle className="size-3" />
                            <span>{formatCount(totalChats)}</span>
                        </Badge>
                    </div>

                    {/* Bottom Content */}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                        {/* Category Badge */}
                        {category && (
                            <Badge
                                className={cn(
                                    "mb-2 rounded-full border-0 px-2.5 py-0.5 text-xs font-medium",
                                    "transition-all duration-300",
                                    isHovering && "scale-105"
                                )}
                                style={{
                                    backgroundColor: categoryColor
                                        ? `${categoryColor}30`
                                        : "rgba(196, 167, 231, 0.3)",
                                    color: categoryColor || "#c4a7e7"
                                }}
                            >
                                {category}
                            </Badge>
                        )}

                        {/* Character Name */}
                        <h3 className={cn(
                            "font-tiempos-headline line-clamp-2 text-lg font-bold leading-tight drop-shadow-lg",
                            "transition-transform duration-300",
                            isHovering && "translate-x-1"
                        )}
                            style={{ color: '#BE8E95' }}>
                            {name}
                        </h3>
                    </div>
                </div>
            </div>
        </Link>
    )
}
