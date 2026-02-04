"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Coins, Sparkles } from "lucide-react"
import { PullResult as PullResultType, RARITY_COLORS } from "@/lib/hooks/use-gacha"
import { HolographicCard } from "./HolographicCard"
import { Badge } from "@/components/ui/badge"

// This is the single-card display used by PullAnimation
interface PullCardProps {
    result: PullResultType
    onAddToLibrary: (personaId: string) => void
    onConvertToAether: (pullId: string) => void
}

export function PullResult({
    result,
    onAddToLibrary,
    onConvertToAether
}: PullCardProps) {
    const rarityColor = RARITY_COLORS[result.rarity]
    const isHighRarity = result.rarity === "epic" || result.rarity === "legendary"

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Character Name with Entrance */}
            <div
                className="text-center animate-fadeIn"
                style={{ animationDelay: "0.2s" }}
            >
                <h2
                    className="text-2xl md:text-3xl font-bold text-white mb-1"
                    style={{
                        textShadow: `0 0 20px ${rarityColor.glow}, 0 0 40px ${rarityColor.glow}`
                    }}
                >
                    {result.persona?.name || "Unknown Soul"}
                </h2>

                {/* Rarity Badge with Animation */}
                <Badge
                    className={cn(
                        "px-4 py-1 text-sm font-bold uppercase tracking-widest",
                        isHighRarity && "animate-pulse"
                    )}
                    style={{
                        background: `linear-gradient(135deg, ${rarityColor.primary}, ${rarityColor.glow})`,
                        color: result.rarity === "legendary" ? "#191724" : "#faf4ed",
                        boxShadow: `0 0 15px ${rarityColor.glow}`
                    }}
                >
                    {result.is_new && <Sparkles className="inline-block w-3 h-3 mr-1" />}
                    {result.rarity}
                    {result.is_new && " ✦ NEW"}
                </Badge>
            </div>

            {/* Character Card with Holographic Effect */}
            <div
                className="relative animate-fadeIn"
                style={{ animationDelay: "0.1s" }}
            >
                <HolographicCard
                    imageUrl={result.persona?.image_url || "/images/placeholder-soul.png"}
                    name={result.persona?.name || "Unknown Soul"}
                    rarity={result.rarity}
                    className="w-[280px] h-[400px] md:w-[320px] md:h-[460px]"
                    showBadge={false}
                    isNew={result.is_new}
                />

                {/* Pity Indicator */}
                {result.is_pity && (
                    <div
                        className="absolute -top-2 -right-2 z-20 animate-bounce"
                        title="Guaranteed by Pity System"
                    >
                        <Badge
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs px-2 py-1 shadow-lg"
                            style={{ boxShadow: "0 0 15px rgba(245, 158, 11, 0.6)" }}
                        >
                            ★ PITY
                        </Badge>
                    </div>
                )}
            </div>

            {/* Description (if available) */}
            {result.persona?.description && (
                <p
                    className="text-white/60 text-sm text-center max-w-sm animate-fadeIn"
                    style={{ animationDelay: "0.3s" }}
                >
                    {result.persona.description}
                </p>
            )}

            {/* Actions */}
            <div
                className="flex gap-3 animate-fadeIn"
                style={{ animationDelay: "0.4s" }}
            >
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConvertToAether(result.id)}
                    className={cn(
                        "border-white/20 bg-white/5 text-white/70",
                        "hover:bg-white/10 hover:text-white hover:border-white/30",
                        "transition-all duration-200"
                    )}
                >
                    <Coins className="mr-2 size-4" />
                    Convert (5 Aether)
                </Button>
                <Button
                    size="sm"
                    onClick={() => onAddToLibrary(result.persona_id)}
                    className={cn(
                        "bg-gradient-to-r from-rp-iris to-rp-foam",
                        "hover:opacity-90 transition-all duration-200",
                        "shadow-lg shadow-rp-iris/30"
                    )}
                >
                    <Plus className="mr-2 size-4" />
                    Add to Library
                </Button>
            </div>
        </div>
    )
}
