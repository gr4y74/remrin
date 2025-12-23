"use client"

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ElectricCardProps {
    children: ReactNode
    rarity?: "common" | "rare" | "epic" | "legendary"
    className?: string
    onClick?: () => void
}

const RARITY_COLORS = {
    common: {
        border: "#6b7280",      // gray-500
        glow: "rgba(107, 114, 128, 0.3)",
        gradient: "rgba(107, 114, 128, 0.15)"
    },
    rare: {
        border: "#8b5cf6",      // purple-500
        glow: "rgba(139, 92, 246, 0.4)",
        gradient: "rgba(139, 92, 246, 0.2)"
    },
    epic: {
        border: "#ec4899",      // pink-500
        glow: "rgba(236, 72, 153, 0.5)",
        gradient: "rgba(236, 72, 153, 0.25)"
    },
    legendary: {
        border: "#f59e0b",      // amber-500
        glow: "rgba(245, 158, 11, 0.6)",
        gradient: "rgba(245, 158, 11, 0.3)"
    }
}

export function ElectricCard({
    children,
    rarity = "common",
    className,
    onClick
}: ElectricCardProps) {
    const colors = RARITY_COLORS[rarity]
    const isAnimated = rarity === "epic" || rarity === "legendary"

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative cursor-pointer transition-transform duration-300",
                "hover:scale-[1.02]",
                className
            )}
        >
            {/* Background glow (only for epic/legendary) */}
            {isAnimated && (
                <div
                    className="absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10 animate-pulse"
                    style={{
                        background: `linear-gradient(-30deg, ${colors.border}, transparent, ${colors.glow})`,
                        transform: "scale(1.1)"
                    }}
                />
            )}

            {/* Outer glow layers */}
            {isAnimated && (
                <>
                    <div
                        className="absolute inset-0 rounded-2xl blur-sm opacity-60"
                        style={{ border: `2px solid ${colors.glow}` }}
                    />
                    <div
                        className="absolute inset-0 rounded-2xl blur-md opacity-40"
                        style={{ border: `2px solid ${colors.border}` }}
                    />
                </>
            )}

            {/* Main card container */}
            <div
                className={cn(
                    "relative rounded-2xl p-[2px] overflow-hidden",
                    isAnimated && "electric-border-animated"
                )}
                style={{
                    background: isAnimated
                        ? `linear-gradient(-30deg, ${colors.gradient}, transparent, ${colors.gradient}), 
                           linear-gradient(to bottom, #0a0a0f, #0a0a0f)`
                        : "#12121a"
                }}
            >
                {/* Inner border */}
                <div
                    className="rounded-[calc(1rem-2px)] overflow-hidden"
                    style={{
                        border: `2px solid ${colors.border}`,
                        boxShadow: isAnimated ? `0 0 20px ${colors.glow}` : "none"
                    }}
                >
                    {/* Card content */}
                    <div className="bg-[#0a0a0f] rounded-[calc(1rem-4px)]">
                        {children}
                    </div>
                </div>
            </div>

            {/* Overlay shine effect */}
            {isAnimated && (
                <div
                    className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-overlay opacity-30"
                    style={{
                        background: "linear-gradient(-30deg, white, transparent 30%, transparent 70%, white)",
                        filter: "blur(8px)",
                        transform: "scale(1.05)"
                    }}
                />
            )}
        </div>
    )
}

// For legendary cards - extra electric animation
export function LegendaryElectricCard({
    children,
    className,
    onClick
}: Omit<ElectricCardProps, "rarity">) {
    return (
        <div className="relative group">
            {/* Animated electric effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ overflow: "visible" }}>
                <defs>
                    <filter id="electric-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feTurbulence
                            type="turbulence"
                            baseFrequency="0.05"
                            numOctaves="3"
                            seed="1"
                        >
                            <animate
                                attributeName="seed"
                                values="1;10;1"
                                dur="0.5s"
                                repeatCount="indefinite"
                            />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" scale="3" />
                        <feGaussianBlur stdDeviation="1" />
                    </filter>
                </defs>
            </svg>

            <ElectricCard rarity="legendary" className={className} onClick={onClick}>
                {children}
            </ElectricCard>
        </div>
    )
}
