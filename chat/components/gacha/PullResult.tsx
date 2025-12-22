"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Coins } from "lucide-react"
import { PullResult as PullResultType, RARITY_COLORS } from "@/lib/hooks/use-gacha"

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

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Card */}
            <div
                className="relative h-80 w-56 overflow-hidden rounded-xl shadow-2xl"
                style={{
                    boxShadow: `0 0 40px ${rarityColor.glow}`
                }}
            >
                {/* Rarity Gradient Border */}
                <div
                    className="absolute inset-0 p-1"
                    style={{
                        background: `linear-gradient(135deg, ${rarityColor.primary}, ${rarityColor.glow})`
                    }}
                >
                    <div className="h-full w-full overflow-hidden rounded-lg bg-background">
                        {/* Portrait */}
                        <div className="relative h-48 w-full">
                            <img
                                src={result.persona?.image_url || "/placeholder-soul.png"}
                                alt={result.persona?.name || "Soul"}
                                className="h-full w-full object-cover"
                            />
                            {result.is_new && (
                                <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground animate-pulse">
                                    NEW!
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="p-3 text-center">
                            <h3 className="truncate text-lg font-bold text-white">
                                {result.persona?.name || "Unknown Soul"}
                            </h3>
                            <div className="mt-1 flex justify-center gap-0.5">
                                {Array.from({
                                    length: result.rarity === "legendary" ? 5 :
                                        result.rarity === "epic" ? 4 :
                                            result.rarity === "rare" ? 3 : 1
                                }).map((_, i) => (
                                    <span key={i} className="text-yellow-400">
                                        ★
                                    </span>
                                ))}
                            </div>
                            <p
                                className="mt-1 text-sm font-semibold capitalize"
                                style={{ color: rarityColor.primary }}
                            >
                                {result.rarity}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onConvertToAether(result.id)}
                >
                    <Coins className="mr-2 size-4" />
                    Convert (5 Aether)
                </Button>
                <Button
                    size="sm"
                    onClick={() => onAddToLibrary(result.persona_id)}
                >
                    <Plus className="mr-2 size-4" />
                    Add to Library
                </Button>
            </div>
        </div>
    )
}
