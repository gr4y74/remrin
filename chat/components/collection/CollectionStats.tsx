"use client"

import { cn } from "@/lib/utils"
import { IconDiamond, IconStar, IconTrendingUp, IconFlame } from "@tabler/icons-react"
import { CollectionStats as Stats, PityInfo, Rarity } from "@/hooks/use-collection"

interface CollectionStatsProps {
    stats: Stats
    pityInfo: PityInfo | null
    className?: string
}

const RARITY_CONFIG: Record<Rarity, {
    label: string
    color: string
    bgColor: string
    icon: string
}> = {
    legendary: {
        label: "Legendary",
        color: "text-rp-gold",
        bgColor: "bg-rp-gold/20",
        icon: "⭐"
    },
    epic: {
        label: "Epic",
        color: "text-rp-iris",
        bgColor: "bg-rp-iris/20",
        icon: "💜"
    },
    rare: {
        label: "Rare",
        color: "text-rp-pine",
        bgColor: "bg-rp-pine/20",
        icon: "💎"
    },
    common: {
        label: "Common",
        color: "text-rp-subtle",
        bgColor: "bg-rp-muted/20",
        icon: "⚪"
    }
}

function ProgressBar({
    value,
    max,
    color = "bg-white"
}: {
    value: number
    max: number
    color?: string
}) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

    return (
        <div className="h-2 w-full overflow-hidden rounded-full bg-rp-base">
            <div
                className={cn("h-full rounded-full transition-all duration-500", color)}
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}

export function CollectionStats({
    stats,
    pityInfo,
    className
}: CollectionStatsProps) {
    const rarities: Rarity[] = ["legendary", "epic", "rare", "common"]

    return (
        <div className={cn("space-y-6", className)}>
            {/* Overall Progress */}
            <div className="rounded-xl border border-rp-muted/20 bg-rp-surface p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <IconDiamond className="size-5 text-rp-gold" />
                    <h3 className="font-semibold text-rp-text">Collection Progress</h3>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-rp-subtle">Total Souls</span>
                        <span className="font-medium text-rp-text">
                            {stats.totalOwned} / {stats.totalAvailable}
                        </span>
                    </div>
                    <ProgressBar
                        value={stats.totalOwned}
                        max={stats.totalAvailable}
                        color="bg-gradient-to-r from-rp-gold to-rp-rose"
                    />
                    <div className="text-right text-xs text-muted-foreground">
                        {stats.overallPercentage}% Complete
                    </div>
                </div>
            </div>

            {/* Rarity Breakdown */}
            <div className="rounded-xl border border-rp-muted/20 bg-rp-surface p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <IconStar className="size-5 text-rp-iris" />
                    <h3 className="font-semibold text-rp-text">By Rarity</h3>
                </div>

                <div className="mt-4 space-y-4">
                    {rarities.map((rarity) => {
                        const config = RARITY_CONFIG[rarity]
                        const rarityStats = stats.byRarity[rarity]

                        return (
                            <div key={rarity} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className={cn("flex items-center gap-1.5 text-sm", config.color)}>
                                        <span>{config.icon}</span>
                                        {config.label}
                                    </span>
                                    <span className="text-xs text-rp-muted">
                                        {rarityStats.owned}/{rarityStats.total}
                                    </span>
                                </div>
                                <ProgressBar
                                    value={rarityStats.owned}
                                    max={rarityStats.total}
                                    color={config.bgColor.replace("/20", "")}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Pity Counter */}
            {pityInfo && (
                <div className="rounded-xl border border-rp-muted/20 bg-rp-surface p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <IconFlame className="size-5 text-rp-rose" />
                        <h3 className="font-semibold text-rp-text">Pity Counter</h3>
                    </div>

                    <div className="mt-4 space-y-4">
                        {/* Legendary Pity */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-rp-gold">Legendary Pity</span>
                                <span className="text-xs text-rp-muted">
                                    {pityInfo.pullsSinceLegendary}/{pityInfo.legendaryPity}
                                </span>
                            </div>
                            <ProgressBar
                                value={pityInfo.pullsSinceLegendary}
                                max={pityInfo.legendaryPity}
                                color="bg-gradient-to-r from-rp-gold to-rp-iris"
                            />
                            {pityInfo.pullsSinceLegendary >= 75 && (
                                <p className="flex items-center gap-1 text-xs text-rp-gold">
                                    <IconTrendingUp className="size-3" />
                                    Increased rates active!
                                </p>
                            )}
                        </div>

                        {/* Rare Pity */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-rp-pine">Rare Pity</span>
                                <span className="text-xs text-rp-muted">
                                    {pityInfo.pullsSinceRare}/{pityInfo.rarePity}
                                </span>
                            </div>
                            <ProgressBar
                                value={pityInfo.pullsSinceRare}
                                max={pityInfo.rarePity}
                                color="bg-gradient-to-r from-rp-pine to-rp-foam"
                            />
                        </div>

                        {/* Total Pulls */}
                        <div className="flex items-center justify-between border-t border-rp-muted/20 pt-3 text-sm">
                            <span className="text-rp-subtle">Total Pulls</span>
                            <span className="font-semibold text-rp-text">{pityInfo.totalPulls}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
