"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconPlayerSkipForward } from "@tabler/icons-react"
import { PullResult, RARITY_COLORS } from "@/lib/hooks/use-gacha"
import { PullResult as PullResultComponent } from "./PullResult"

interface PullAnimationProps {
    results: PullResult[]
    onComplete: () => void
    onAddToLibrary?: (personaId: string) => void
    onConvertToAether?: (pullId: string) => void
    className?: string
}

type AnimationPhase = "orb" | "reveal" | "cards" | "complete"

// Get the highest rarity from results
function getHighestRarity(results: PullResult[]): "common" | "rare" | "epic" | "legendary" {
    const rarityOrder = ["common", "rare", "epic", "legendary"] as const
    let highest = 0
    for (const result of results) {
        const index = rarityOrder.indexOf(result.rarity)
        if (index > highest) highest = index
    }
    return rarityOrder[highest]
}

export function PullAnimation({
    results,
    onComplete,
    onAddToLibrary,
    onConvertToAether,
    className
}: PullAnimationProps) {
    const [phase, setPhase] = useState<AnimationPhase>("orb")
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [showSkip, setShowSkip] = useState(false)
    const [startTime] = useState(Date.now())

    const highestRarity = getHighestRarity(results)
    const orbColor = RARITY_COLORS[highestRarity]
    const isSinglePull = results.length === 1

    // Show skip button after 2 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowSkip(true), 2000)
        return () => clearTimeout(timer)
    }, [])

    // Animation phase progression
    useEffect(() => {
        if (phase === "orb") {
            // Orb phase: 2.5 seconds
            const timer = setTimeout(() => setPhase("reveal"), 2500)
            return () => clearTimeout(timer)
        }
        if (phase === "reveal") {
            // Reveal phase: 1 second
            const timer = setTimeout(() => setPhase("cards"), 1000)
            return () => clearTimeout(timer)
        }
    }, [phase])

    // Handle skip
    const handleSkip = useCallback(() => {
        setPhase("cards")
        setCurrentCardIndex(0)
    }, [])

    // Handle card navigation
    const handleNextCard = useCallback(() => {
        if (currentCardIndex < results.length - 1) {
            setCurrentCardIndex(prev => prev + 1)
        } else {
            setPhase("complete")
            onComplete()
        }
    }, [currentCardIndex, results.length, onComplete])

    // Handle close/complete all
    const handleCompleteAll = useCallback(() => {
        setPhase("complete")
        onComplete()
    }, [onComplete])

    // Generate particles
    const generateParticles = (count: number, rarity: "common" | "rare" | "epic" | "legendary") => {
        const particles = []
        const color = RARITY_COLORS[rarity].primary

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * 360
            const distance = 100 + Math.random() * 150
            const tx = Math.cos((angle * Math.PI) / 180) * distance
            const ty = Math.sin((angle * Math.PI) / 180) * distance
            const delay = Math.random() * 0.5
            const size = rarity === "legendary" ? 8 + Math.random() * 8 : 4 + Math.random() * 4

            particles.push(
                <div
                    key={i}
                    className="absolute left-1/2 top-1/2 rounded-full animate-sparkle-burst"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: color,
                        boxShadow: `0 0 ${size * 2}px ${color}`,
                        "--tx": `${tx}px`,
                        "--ty": `${ty}px`,
                        animationDelay: `${delay}s`
                    } as React.CSSProperties}
                />
            )
        }
        return particles
    }

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center",
                "bg-black/95 backdrop-blur-xl",
                className
            )}
        >
            {/* Orb Phase */}
            {phase === "orb" && (
                <div className="relative flex flex-col items-center justify-center">
                    {/* Background glow */}
                    <div
                        className="absolute size-[400px] rounded-full blur-3xl opacity-30 animate-gacha-orb-pulse"
                        style={{ backgroundColor: orbColor.primary }}
                    />

                    {/* Main orb */}
                    <div
                        className="relative size-32 rounded-full animate-gacha-orb-pulse"
                        style={{
                            background: `radial-gradient(circle at 30% 30%, white, ${orbColor.primary})`,
                            boxShadow: `0 0 60px ${orbColor.glow}, 0 0 120px ${orbColor.glow}`
                        }}
                    >
                        {/* Inner shine */}
                        <div className="absolute inset-4 rounded-full bg-white/30 blur-sm" />
                    </div>

                    {/* Rotating ring */}
                    <div
                        className="absolute size-48 rounded-full border-2 border-dashed animate-gradient-rotate"
                        style={{ borderColor: orbColor.primary, opacity: 0.5 }}
                    />
                    <div
                        className="absolute size-56 rounded-full border animate-gradient-rotate"
                        style={{
                            borderColor: orbColor.primary,
                            opacity: 0.3,
                            animationDirection: "reverse",
                            animationDuration: "12s"
                        }}
                    />

                    {/* Text */}
                    <p className="mt-12 text-lg font-medium text-white/60 animate-pulse">
                        Summoning souls from the Aether...
                    </p>
                </div>
            )}

            {/* Reveal Phase - Burst Effect */}
            {phase === "reveal" && (
                <div className="relative flex items-center justify-center">
                    {/* Bright flash */}
                    <div
                        className="absolute size-[600px] rounded-full animate-sparkle-burst"
                        style={{
                            background: `radial-gradient(circle, ${orbColor.primary}, transparent 70%)`,
                            opacity: 0.8
                        }}
                    />

                    {/* Particles */}
                    {generateParticles(highestRarity === "legendary" ? 40 : 20, highestRarity)}
                </div>
            )}

            {/* Cards Phase */}
            {phase === "cards" && (
                <div className="relative flex flex-col items-center justify-center w-full max-w-lg px-4">
                    {/* Single card display */}
                    <div className="w-full animate-card-flip">
                        <PullResultComponent
                            result={results[currentCardIndex]}
                            onAddToLibrary={onAddToLibrary || (() => { })}
                            onConvertToAether={onConvertToAether || (() => { })}
                        />
                    </div>

                    {/* Navigation */}
                    <div className="mt-8 flex items-center gap-4">
                        {/* Progress indicator for multi-pull */}
                        {results.length > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/60">
                                    {currentCardIndex + 1} / {results.length}
                                </span>
                                <div className="flex gap-1">
                                    {results.map((r, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "size-2 rounded-full transition-all duration-200",
                                                i === currentCardIndex
                                                    ? "scale-125"
                                                    : "opacity-50"
                                            )}
                                            style={{
                                                backgroundColor: RARITY_COLORS[r.rarity].primary,
                                                boxShadow: i === currentCardIndex
                                                    ? `0 0 8px ${RARITY_COLORS[r.rarity].glow}`
                                                    : "none"
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Next / Done button */}
                        <Button
                            onClick={handleNextCard}
                            className={cn(
                                "rounded-full px-8 py-3 font-semibold",
                                "bg-gradient-to-r from-purple-600 to-cyan-600",
                                "hover:from-purple-500 hover:to-cyan-500",
                                "transition-all duration-200 hover:scale-105"
                            )}
                        >
                            {currentCardIndex < results.length - 1 ? "Next" : "Done"}
                        </Button>

                        {/* Skip remaining (if multi-pull) */}
                        {results.length > 1 && currentCardIndex < results.length - 1 && (
                            <Button
                                variant="ghost"
                                onClick={handleCompleteAll}
                                className="text-white/50 hover:text-white/80"
                            >
                                Skip All
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Skip Button (during orb/reveal phase) */}
            {showSkip && (phase === "orb" || phase === "reveal") && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className={cn(
                        "absolute bottom-8 right-8",
                        "text-white/40 hover:text-white/70",
                        "flex items-center gap-2"
                    )}
                >
                    <IconPlayerSkipForward size={18} />
                    <span>Skip</span>
                </Button>
            )}
        </div>
    )
}
