"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Plus, Coins } from "lucide-react"
import { PullResult as PullResultType, RARITY_COLORS } from "@/lib/hooks/use-gacha"
import { HolographicCard } from "./HolographicCard"

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
            {/* Character Card with Holographic Effect */}
            <div className="relative mb-6">
                <HolographicCard
                    imageUrl={result.persona?.image_url || "/images/placeholder-soul.png"}
                    name={result.persona?.name || "Unknown Soul"}
                    rarity={result.rarity}
                    className="w-full max-w-sm mx-auto aspect-[2/3]"
                    showBadge={false}
                />
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
