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
        border: "#6e6a86",      // rp-muted
        glow: "rgba(110, 106, 134, 0.3)",
        gradient: "rgba(110, 106, 134, 0.15)"
    },
    rare: {
        border: "#c4a7e7",      // rp-iris
        glow: "rgba(196, 167, 231, 0.4)",
        gradient: "rgba(196, 167, 231, 0.2)"
    },
    epic: {
        border: "#ebbcba",      // rp-rose
        glow: "rgba(235, 188, 186, 0.5)",
        gradient: "rgba(235, 188, 186, 0.25)"
    },
    legendary: {
        border: "#f6c177",      // rp-gold
        glow: "rgba(246, 193, 119, 0.6)",
        gradient: "rgba(246, 193, 119, 0.3)"
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
            {/* Background glow (only for epic/legendary) - more subtle */}
            {isAnimated && (
                <div
                    className="absolute inset-0 -z-10 animate-pulse rounded-2xl opacity-20 blur-md"
                    style={{
                        background: `radial-gradient(circle at center, ${colors.glow}, transparent 70%)`,
                        transform: "scale(1.05)"
                    }}
                />
            )}

            {/* Outer glow layers - more subtle */}
            {isAnimated && (
                <>
                    <div
                        className="absolute inset-0 rounded-2xl opacity-30 blur-sm"
                        style={{ border: `1px solid ${colors.glow}` }}
                    />
                    <div
                        className="absolute inset-0 rounded-2xl opacity-20 blur-md"
                        style={{ border: `1px solid ${colors.border}` }}
                    />
                </>
            )}

            {/* Main card container */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-2xl p-[2px]",
                    isAnimated && "electric-border-animated"
                )}
                style={{
                    background: isAnimated
                        ? `linear-gradient(-30deg, ${colors.gradient}, transparent, ${colors.gradient}), 
                           linear-gradient(to bottom, var(--rp-base), var(--rp-base))`
                        : "var(--rp-surface)"
                }}
            >
                {/* Inner border */}
                <div
                    className="overflow-hidden rounded-[calc(1rem-2px)]"
                    style={{
                        border: `2px solid ${colors.border}`,
                        boxShadow: isAnimated ? `0 0 10px ${colors.glow}` : "none"
                    }}
                >
                    {/* Card content */}
                    <div className="bg-rp-base rounded-[calc(1rem-4px)]">
                        {children}
                    </div>
                </div>
            </div>

            {/* Overlay shine effect */}
            {isAnimated && (
                <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-30 mix-blend-overlay"
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
        <div className="group relative">
            {/* Animated electric effect */}
            <svg className="pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ overflow: "visible" }}>
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
