"use client"

import { useState, useRef, MouseEvent, useMemo } from "react"
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
    showName?: boolean
    isNew?: boolean
    onClick?: () => void
}

const RARITY_COLORS = {
    common: {
        primary: "rgb(59, 130, 246)", // blue
        glow: "rgba(59, 130, 246, 0.6)",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
        shimmer: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)"
    },
    rare: {
        primary: "rgb(168, 85, 247)", // purple
        glow: "rgba(168, 85, 247, 0.6)",
        gradient: "linear-gradient(135deg, #a855f7 0%, #c084fc 100%)",
        shimmer: "linear-gradient(90deg, transparent, rgba(168,85,247,0.4), transparent)"
    },
    epic: {
        primary: "rgb(236, 72, 153)", // pink
        glow: "rgba(236, 72, 153, 0.6)",
        gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
        shimmer: "linear-gradient(90deg, transparent, rgba(236,72,153,0.5), transparent)"
    },
    legendary: {
        primary: "rgb(245, 158, 11)", // gold
        glow: "rgba(245, 158, 11, 0.8)",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
        shimmer: "linear-gradient(90deg, transparent, rgba(255,215,0,0.6), rgba(255,255,255,0.8), rgba(255,215,0,0.6), transparent)"
    }
}

// Generate floating sparkle positions
function FloatingSparkles({ rarity }: { rarity: Rarity }) {
    const sparkles = useMemo(() => {
        const count = rarity === "legendary" ? 8 : rarity === "epic" ? 5 : 0
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80,
            size: 2 + Math.random() * 3,
            delay: Math.random() * 2
        }))
    }, [rarity])

    if (sparkles.length === 0) return null

    return (
        <>
            {sparkles.map((sparkle) => (
                <div
                    key={sparkle.id}
                    className="absolute pointer-events-none animate-gacha-float-sparkle"
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                        width: sparkle.size,
                        height: sparkle.size,
                        backgroundColor: "white",
                        borderRadius: "50%",
                        boxShadow: `0 0 ${sparkle.size * 2}px white`,
                        animationDelay: `${sparkle.delay}s`
                    }}
                />
            ))}
        </>
    )
}

export function HolographicCard({
    imageUrl,
    name,
    rarity,
    className,
    showBadge = true,
    showName = false,
    isNew = false,
    onClick
}: HolographicCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [rotateX, setRotateX] = useState(0)
    const [rotateY, setRotateY] = useState(0)
    const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 })
    const [isHovered, setIsHovered] = useState(false)

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return

        const card = cardRef.current
        const rect = card.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Calculate rotation (-15 to 15 degrees, enhanced on hover)
        const intensity = isHovered ? 20 : 15
        const rotY = ((x - centerX) / centerX) * intensity
        const rotX = ((centerY - y) / centerY) * intensity

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
        setIsHovered(false)
    }

    const handleMouseEnter = () => {
        setIsHovered(true)
    }

    const colors = RARITY_COLORS[rarity]

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
            onClick={onClick}
            className={cn(
                "relative group cursor-pointer",
                "transition-transform duration-200 ease-out",
                className
            )}
            style={{
                perspective: "1000px",
                "--gacha-glow": colors.glow
            } as React.CSSProperties}
        >
            <div
                className={cn(
                    "relative w-full h-full rounded-xl overflow-hidden shadow-2xl transition-all duration-200 ease-out",
                    (rarity === "legendary" || rarity === "epic") && "animate-gacha-border-glow"
                )}
                style={{
                    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
                    transformStyle: "preserve-3d",
                    boxShadow: `0 0 ${isHovered ? 50 : 30}px ${colors.glow}, 0 10px 40px rgba(0,0,0,0.3)`,
                    "--gacha-glow": colors.glow
                } as React.CSSProperties}
            >
                {/* Animated Border for Legendary */}
                {rarity === "legendary" && (
                    <div
                        className="absolute inset-0 rounded-xl animate-gradient-rotate"
                        style={{
                            background: "conic-gradient(from 0deg, #f59e0b, #fbbf24, #fef3c7, #fbbf24, #f59e0b)",
                            padding: "3px",
                            backgroundSize: "100% 100%"
                        }}
                    />
                )}

                {/* Card Border with Rarity Color */}
                <div
                    className={cn(
                        "absolute inset-0 rounded-xl",
                        rarity !== "legendary" && "border-0"
                    )}
                    style={{
                        background: rarity === "legendary" ? "transparent" : colors.gradient,
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

                        {/* Floating Sparkles for Epic/Legendary */}
                        <FloatingSparkles rarity={rarity} />

                        {/* Holographic Overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                            style={{
                                background: rarity === "legendary"
                                    ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.9) 0%,
                                        rgba(255,215,0,0.6) 15%,
                                        rgba(255,105,180,0.4) 35%,
                                        rgba(138,43,226,0.3) 55%,
                                        rgba(59,130,246,0.2) 75%,
                                        transparent 90%)`
                                    : rarity === "epic"
                                        ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.7) 0%,
                                        rgba(236,72,153,0.5) 25%,
                                        rgba(168,85,247,0.3) 50%,
                                        transparent 75%)`
                                        : rarity === "rare"
                                            ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.5) 0%,
                                        rgba(168,85,247,0.4) 30%,
                                        transparent 70%)`
                                            : `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, 
                                        rgba(255,255,255,0.3) 0%,
                                        transparent 60%)`,
                                mixBlendMode: "overlay",
                                opacity: isHovered ? 0.9 : 0.7
                            }}
                        />

                        {/* Rainbow Shimmer for Legendary */}
                        {rarity === "legendary" && (
                            <div
                                className="absolute inset-0 pointer-events-none animate-gacha-shimmer"
                                style={{
                                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 20%, rgba(255,215,0,0.3) 40%, rgba(255,255,255,0.5) 50%, rgba(255,215,0,0.3) 60%, rgba(255,255,255,0) 80%, transparent 100%)",
                                    backgroundSize: "200% 100%",
                                    mixBlendMode: "overlay"
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
                                    rgba(255,255,255,0.4) 50%,
                                    rgba(255,255,255,0.1) 55%,
                                    transparent 100%
                                )`,
                                transform: `translateX(${rotateY * 2}px)`,
                                transition: "transform 0.1s ease-out"
                            }}
                        />

                        {/* NEW Badge */}
                        {isNew && (
                            <div className="absolute top-2 right-2 z-20">
                                <Badge
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-xs px-2 py-0.5 animate-pulse shadow-lg"
                                    style={{
                                        boxShadow: "0 0 15px rgba(16, 185, 129, 0.6)"
                                    }}
                                >
                                    NEW
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                {/* Name Display (optional) */}
                {showName && (
                    <div className="absolute bottom-12 left-0 right-0 z-10 text-center">
                        <p
                            className="text-white font-bold text-lg drop-shadow-lg px-2 truncate"
                            style={{
                                textShadow: `0 0 10px ${colors.glow}, 0 2px 4px rgba(0,0,0,0.5)`
                            }}
                        >
                            {name}
                        </p>
                    </div>
                )}

                {/* Rarity Badge */}
                {showBadge && (
                    <Badge
                        className={cn(
                            "absolute bottom-2 left-1/2 -translate-x-1/2 z-10 rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wider shadow-lg transition-all duration-200",
                            isHovered && "scale-110"
                        )}
                        style={{
                            background: colors.gradient,
                            color: rarity === "legendary" ? "#191724" : "#faf4ed",
                            boxShadow: `0 0 ${isHovered ? 25 : 15}px ${colors.glow}`
                        }}
                    >
                        {rarity}
                    </Badge>
                )}
            </div>
        </div>
    )
}
