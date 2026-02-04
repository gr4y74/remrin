"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconPlayerSkipForward } from "@tabler/icons-react"
import { PullResult, RARITY_COLORS } from "@/lib/hooks/use-gacha"
import { PullResult as PullResultComponent } from "./PullResult"
import { useSFX } from "@/lib/hooks/use-sfx"

interface PullAnimationProps {
    results: PullResult[]
    onComplete: () => void
    onAddToLibrary?: (personaId: string) => void
    onConvertToAether?: (pullId: string) => void
    className?: string
}

// Animation phases with dramatic timing
type AnimationPhase = "gathering" | "charging" | "burst" | "reveal" | "cards" | "complete"

// Rarity configuration for visual effects
const RARITY_EFFECTS = {
    common: {
        particleCount: 15,
        shakeClass: "",
        flashDuration: 300,
        glowIntensity: 0.4,
        lightRays: false,
        chromatic: false
    },
    rare: {
        particleCount: 25,
        shakeClass: "",
        flashDuration: 400,
        glowIntensity: 0.6,
        lightRays: false,
        chromatic: false
    },
    epic: {
        particleCount: 40,
        shakeClass: "animate-gacha-shake-light",
        flashDuration: 500,
        glowIntensity: 0.8,
        lightRays: true,
        chromatic: false
    },
    legendary: {
        particleCount: 60,
        shakeClass: "animate-gacha-shake-heavy",
        flashDuration: 700,
        glowIntensity: 1,
        lightRays: true,
        chromatic: true
    }
} as const

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

// Generate gathering stars
function GatheringStars({ count, color }: { count: number; color: string }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => {
                const angle = (i / count) * 360
                const distance = 200 + Math.random() * 150
                const startX = Math.cos((angle * Math.PI) / 180) * distance
                const startY = Math.sin((angle * Math.PI) / 180) * distance
                const delay = Math.random() * 0.8

                return (
                    <div
                        key={i}
                        className="absolute left-1/2 top-1/2 rounded-full animate-gacha-stars-gather"
                        style={{
                            width: 4 + Math.random() * 4,
                            height: 4 + Math.random() * 4,
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}`,
                            "--start-x": `${startX}px`,
                            "--start-y": `${startY}px`,
                            animationDelay: `${delay}s`
                        } as React.CSSProperties}
                    />
                )
            })}
        </>
    )
}

// Generate burst particles
function BurstParticles({ count, rarity }: { count: number; rarity: "common" | "rare" | "epic" | "legendary" }) {
    const color = RARITY_COLORS[rarity].primary

    return (
        <>
            {Array.from({ length: count }).map((_, i) => {
                const angle = (i / count) * 360 + Math.random() * 30
                const distance = 150 + Math.random() * 250
                const tx = Math.cos((angle * Math.PI) / 180) * distance
                const ty = Math.sin((angle * Math.PI) / 180) * distance
                const delay = Math.random() * 0.3
                const size = rarity === "legendary" ? 6 + Math.random() * 10 : 4 + Math.random() * 6

                return (
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
            })}
        </>
    )
}

// Light rays component for epic/legendary
function LightRays({ color }: { color: string }) {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute left-1/2 top-1/2 origin-bottom animate-gacha-light-rays"
                    style={{
                        width: 4,
                        height: "50vh",
                        background: `linear-gradient(to top, ${color}, transparent)`,
                        transform: `translateX(-50%) rotate(${i * 30}deg)`,
                        opacity: 0.3,
                        animationDelay: `${i * 0.1}s`
                    }}
                />
            ))}
        </div>
    )
}

export function PullAnimation({
    results,
    onComplete,
    onAddToLibrary,
    onConvertToAether,
    className
}: PullAnimationProps) {
    const [phase, setPhase] = useState<AnimationPhase>("gathering")
    const [currentCardIndex, setCurrentCardIndex] = useState(0)
    const [showSkip, setShowSkip] = useState(false)
    const [showFlash, setShowFlash] = useState(false)

    const { playSuccess, playClick } = useSFX()

    const highestRarity = useMemo(() => getHighestRarity(results), [results])
    const orbColor = RARITY_COLORS[highestRarity]
    const effects = RARITY_EFFECTS[highestRarity]

    // Show skip button after 1.5 seconds
    useEffect(() => {
        const timer = setTimeout(() => setShowSkip(true), 1500)
        return () => clearTimeout(timer)
    }, [])

    // Animation phase progression with dramatic timing
    useEffect(() => {
        if (phase === "gathering") {
            // Stars gather phase: 1.2 seconds
            const timer = setTimeout(() => setPhase("charging"), 1200)
            return () => clearTimeout(timer)
        }
        if (phase === "charging") {
            // Orb charges and intensifies: 1.5 seconds
            const timer = setTimeout(() => {
                setShowFlash(true)
                setPhase("burst")
            }, 1500)
            return () => clearTimeout(timer)
        }
        if (phase === "burst") {
            // Burst explosion: 0.8 seconds then reveal
            const timer = setTimeout(() => {
                setShowFlash(false)
                setPhase("reveal")
            }, 800)
            return () => clearTimeout(timer)
        }
        if (phase === "reveal") {
            // Cards fly in: 0.6 seconds
            const timer = setTimeout(() => {
                playSuccess()
                setPhase("cards")
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [phase, playSuccess])

    // Handle skip
    const handleSkip = useCallback(() => {
        setPhase("cards")
        setCurrentCardIndex(0)
        setShowFlash(false)
    }, [])

    // Handle card navigation
    const handleNextCard = useCallback(() => {
        playClick()
        if (currentCardIndex < results.length - 1) {
            setCurrentCardIndex(prev => prev + 1)
        } else {
            setPhase("complete")
            onComplete()
        }
    }, [currentCardIndex, results.length, onComplete, playClick])

    // Handle close/complete all
    const handleCompleteAll = useCallback(() => {
        setPhase("complete")
        onComplete()
    }, [onComplete])

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center",
                "bg-black/95 backdrop-blur-xl",
                effects.shakeClass && (phase === "burst" || phase === "reveal") ? effects.shakeClass : "",
                className
            )}
            style={{
                "--gacha-glow": orbColor.primary,
                "--gacha-glow-inner": orbColor.glow
            } as React.CSSProperties}
        >
            {/* Chromatic Aberration Overlay for Legendary */}
            {effects.chromatic && (phase === "burst" || phase === "reveal") && (
                <div
                    className="absolute inset-0 pointer-events-none mix-blend-screen"
                    style={{
                        background: `
                            radial-gradient(ellipse at 40% 40%, rgba(255,0,0,0.1) 0%, transparent 50%),
                            radial-gradient(ellipse at 60% 60%, rgba(0,0,255,0.1) 0%, transparent 50%)
                        `
                    }}
                />
            )}

            {/* Light Rays for Epic/Legendary */}
            {effects.lightRays && (phase === "burst" || phase === "reveal") && (
                <LightRays color={orbColor.primary} />
            )}

            {/* Flash Effect */}
            {showFlash && (
                <div
                    className="absolute inset-0 bg-white animate-gacha-flash pointer-events-none z-40"
                    style={{
                        opacity: effects.glowIntensity
                    }}
                />
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* GATHERING PHASE - Stars converge to center */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {phase === "gathering" && (
                <div className="relative flex flex-col items-center justify-center">
                    {/* Background glow */}
                    <div
                        className="absolute size-[300px] rounded-full opacity-20 blur-3xl"
                        style={{ backgroundColor: orbColor.primary }}
                    />

                    {/* Gathering stars */}
                    <GatheringStars count={30} color={orbColor.primary} />

                    {/* Small orb forming */}
                    <div
                        className="relative size-16 rounded-full animate-pulse"
                        style={{
                            background: `radial-gradient(circle at 30% 30%, white, ${orbColor.primary})`,
                            boxShadow: `0 0 30px ${orbColor.glow}`
                        }}
                    />

                    {/* Text */}
                    <p className="mt-8 animate-pulse text-lg font-medium text-white/60">
                        Channeling aetheric energy...
                    </p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* CHARGING PHASE - Orb intensifies with rarity color hint */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {phase === "charging" && (
                <div className="relative flex flex-col items-center justify-center">
                    {/* Background glow - getting brighter */}
                    <div
                        className="absolute size-[500px] rounded-full opacity-40 blur-3xl animate-gacha-orb-pulse"
                        style={{
                            backgroundColor: orbColor.primary,
                            "--gacha-glow": orbColor.glow
                        } as React.CSSProperties}
                    />

                    {/* Main orb - charging */}
                    <div
                        className="relative size-32 rounded-full animate-gacha-orb-pulse"
                        style={{
                            background: `radial-gradient(circle at 30% 30%, white, ${orbColor.primary})`,
                            boxShadow: `0 0 60px ${orbColor.glow}, 0 0 120px ${orbColor.glow}`,
                            "--gacha-glow": orbColor.glow
                        } as React.CSSProperties}
                    >
                        {/* Inner shine */}
                        <div className="absolute inset-4 rounded-full bg-white/40 blur-sm" />
                    </div>

                    {/* Rotating rings */}
                    <div
                        className="absolute size-48 rounded-full border-2 border-dashed animate-gradient-rotate"
                        style={{ borderColor: orbColor.primary, opacity: 0.6 }}
                    />
                    <div
                        className="absolute size-56 rounded-full border animate-gradient-rotate"
                        style={{
                            borderColor: orbColor.primary,
                            opacity: 0.4,
                            animationDirection: "reverse",
                            animationDuration: "6s"
                        }}
                    />
                    <div
                        className="absolute size-64 rounded-full border-2 animate-gradient-rotate"
                        style={{
                            borderColor: orbColor.primary,
                            opacity: 0.3,
                            animationDuration: "4s"
                        }}
                    />

                    {/* Rarity hint text */}
                    <p className="mt-16 text-lg font-bold uppercase tracking-widest"
                        style={{ color: orbColor.primary, textShadow: `0 0 20px ${orbColor.glow}` }}
                    >
                        {highestRarity === "legendary" ? "✦ LEGENDARY INCOMING ✦" :
                            highestRarity === "epic" ? "★ Epic Soul Detected ★" :
                                highestRarity === "rare" ? "Rare Energy Sensed..." :
                                    "Summoning..."}
                    </p>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* BURST PHASE - Explosion of particles */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {phase === "burst" && (
                <div className="relative flex items-center justify-center">
                    {/* Expanding glow */}
                    <div
                        className="absolute size-[800px] rounded-full animate-gacha-orb-charge"
                        style={{
                            background: `radial-gradient(circle, ${orbColor.primary}, transparent 70%)`,
                            opacity: 0.9
                        }}
                    />

                    {/* Burst particles */}
                    <BurstParticles count={effects.particleCount} rarity={highestRarity} />
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* REVEAL PHASE - Brief transition before cards */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {phase === "reveal" && (
                <div className="relative flex items-center justify-center">
                    {/* Remaining particles */}
                    <BurstParticles count={Math.floor(effects.particleCount / 3)} rarity={highestRarity} />

                    {/* Fade glow */}
                    <div
                        className="absolute size-[400px] rounded-full opacity-50 blur-2xl transition-opacity duration-500"
                        style={{ backgroundColor: orbColor.primary }}
                    />
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* CARDS PHASE - Display results */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {phase === "cards" && (
                <div className="relative flex w-full max-w-lg flex-col items-center justify-center px-4">
                    {/* Card with entrance animation */}
                    <div className="w-full animate-gacha-card-entrance">
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
                                                "size-2 rounded-full transition-all duration-300",
                                                i === currentCardIndex
                                                    ? "scale-150"
                                                    : i < currentCardIndex
                                                        ? "opacity-30"
                                                        : "opacity-60"
                                            )}
                                            style={{
                                                backgroundColor: RARITY_COLORS[r.rarity].primary,
                                                boxShadow: i === currentCardIndex
                                                    ? `0 0 12px ${RARITY_COLORS[r.rarity].glow}`
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
                                "bg-gradient-to-r from-rp-iris to-rp-foam",
                                "hover:opacity-90",
                                "transition-all duration-200 hover:scale-105",
                                "shadow-lg shadow-rp-iris/30"
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

            {/* Skip Button (during early phases) */}
            {showSkip && (phase === "gathering" || phase === "charging" || phase === "burst" || phase === "reveal") && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className={cn(
                        "absolute bottom-8 right-8",
                        "text-white/40 hover:text-white/70",
                        "flex items-center gap-2 transition-all"
                    )}
                >
                    <IconPlayerSkipForward size={18} />
                    <span>Skip</span>
                </Button>
            )}
        </div>
    )
}
