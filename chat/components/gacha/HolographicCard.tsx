"use client"

import { useState, useRef, MouseEvent } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type Rarity = "common" | "rare" | "epic" | "legendary"

interface HolographicCardProps {
    imageUrl: string
    name: string
    rarity: Rarity
    className?: string
    showBadge?: boolean
    onClick?: () => void
}

const RARITY_COLORS = {
    common: {
        primary: "rgb(59, 130, 246)", // blue
        glow: "rgba(59, 130, 246, 0.6)",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)"
    },
    rare: {
        primary: "rgb(168, 85, 247)", // purple
        glow: "rgba(168, 85, 247, 0.6)",
        gradient: "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)"
    },
    epic: {
        primary: "rgb(236, 72, 153)", // pink
        glow: "rgba(236, 72, 153, 0.6)",
        gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)"
    },
    legendary: {
        primary: "rgb(245, 158, 11)", // gold
        glow: "rgba(245, 158, 11, 0.8)",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)"
    }
}

export function HolographicCard({
    imageUrl,
    name,
    rarity,
    className,
    showBadge = true,
    onClick
}: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [rotateX, setRotateX] = useState(0)
    const [rotateY, setRotateY] = useState(0)
    const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 })

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return

        const card = cardRef.current
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Calculate rotation (-15 to 15 degrees)
        const rotY = ((x - centerX) / centerX) * 15
        const rotX = ((centerY - y) / centerY) * 15

        setRotateX(rotX)
        setRotateY(rotY)

        // Calculate glare position (0-100%)
        const glareX = (x / rect.width) * 100
        const glareY = (y / rect.height) * 100
        setGlarePosition({ x: glareX, y: glareY })
    }

    const handleMouseLeave = () => {
        setRotateX(0)
        setRotateY(0)
        setGlarePosition({ x: 50, y: 50 })
    }

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={cn(
                "relative group cursor-pointer",
                "transition-transform duration-200 ease-out",
                className
            )}
            style={{
                perspective: "1000px"
            }}
        >
            <div
                className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl transition-all duration-200 ease-out"
                style={{
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    transformStyle: "preserve-3d",
                    boxShadow: `0 0 30px ${RARITY_COLORS[rarity].glow}, 0 10px 40px rgba(0,0,0,0.3)`
                }}
            >
                {/* Card Border with Rarity Color */}
                <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                        background: RARITY_COLORS[rarity].gradient,
                        padding: "3px"
                    }}
                >
                    <div className="relative w-full h-full bg-rp-surface rounded-lg overflow-hidden">
                        {/* Character Image */}
                        <div className="relative w-full h-full">
                            <Image
                                src={imageUrl}
                                alt={name}
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Holographic Overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: rarity === "legendary"
                                    ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.8) 0%,
                                        rgba(255,215,0,0.5) 20%,
                                        rgba(255,105,180,0.3) 40%,
                                        rgba(138,43,226,0.2) 60%,
                                        transparent 80%)`
                                    : rarity === "epic"
                                        ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.6) 0%,
                                        rgba(236,72,153,0.4) 30%,
                                        transparent 70%)`
                                        : rarity === "rare"
                                            ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.4) 0%,
                                        rgba(168,85,247,0.3) 30%,
                                        transparent 70%)`
                                            : `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.2) 0%,
                                        transparent 60%)`,
                                mixBlendMode: "overlay",
                                opacity: 0.7,
                                transition: "opacity 0.3s ease"
                            }}
                        />

                        {/* Sparkle Effect for Legendary */}
                        {rarity === "legendary" && (
                            <div
                                className="absolute inset-0 pointer-events-none animate-pulse"
                                style={{
                                    background: `
                                        radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 2%),
                                        radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 2%),
                                        radial-gradient(circle at 70% 70%, rgba(255,255,255,0.3) 0%, transparent 2%),
                                        radial-gradient(circle at 30% 80%, rgba(255,255,255,0.3) 0%, transparent 2%)
                                    `
                                }}
                            />
                        )}

                        {/* Shimmer Line */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: `linear-gradient(
                                    ${Math.atan2(rotateX, rotateY) * (180 / Math.PI)}deg,
                                    transparent 0%,
                                    rgba(255,255,255,0.1) 45%,
                                    rgba(255,255,255,0.3) 50%,
                                    rgba(255,255,255,0.1) 55%,
                                    transparent 100%
                                )`,
                                transform: `translateX(${rotateY * 2}px)`,
                                transition: "transform 0.1s ease-out"
                            }}
                        />
                    </div>
                </div>

                {/* Rarity Badge */}
                {showBadge && (
                    <Badge
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wider shadow-lg"
                        style={{
                            background: RARITY_COLORS[rarity].gradient,
                            color: rarity === "legendary" ? "#191724" : "#faf4ed",
                            boxShadow: `0 0 15px ${RARITY_COLORS[rarity].glow}`
                        }}
                    >
                        {rarity}
                    </Badge>
                )}
            </div>
        </div>
    )
}
