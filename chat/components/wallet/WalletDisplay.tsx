"use client"

import { cn } from "@/lib/utils"
import { IconCoin, IconPlus } from "@tabler/icons-react"
import { FC } from "react"

interface WalletDisplayProps {
    balanceAether: number
    balanceBrain?: number
    variant?: "compact" | "expanded"
    onAddFunds?: () => void
    className?: string
}

// Format balance: 1234 -> "1,234"
function formatBalance(amount: number): string {
    return amount.toLocaleString()
}

export const WalletDisplay: FC<WalletDisplayProps> = ({
    balanceAether,
    balanceBrain = 0,
    variant = "compact",
    onAddFunds,
    className
}) => {
    if (variant === "compact") {
        return (
            <button
                onClick={onAddFunds}
                className={cn(
                    "group flex items-center gap-2 rounded-full px-3 py-1.5",
                    "bg-gradient-to-r from-amber-500/10 to-yellow-500/10",
                    "border border-amber-500/20 hover:border-amber-500/40",
                    "transition-all duration-300 hover:scale-105",
                    "backdrop-blur-sm",
                    className
                )}
            >
                {/* Coin Icon with glow */}
                <div className="relative">
                    <IconCoin
                        size={18}
                        className="text-amber-400 animate-coin-glow"
                    />
                    <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-sm animate-pulse" />
                </div>

                {/* Balance */}
                <span className="text-sm font-semibold text-amber-300">
                    {formatBalance(balanceAether)}
                </span>

                {/* Add indicator on hover */}
                <IconPlus
                    size={14}
                    className="text-amber-400/0 group-hover:text-amber-400 transition-colors duration-200"
                />
            </button>
        )
    }

    // Expanded variant
    return (
        <div
            className={cn(
                "rounded-2xl p-5",
                "bg-gradient-to-br from-white/5 to-white/[0.02]",
                "border border-white/10",
                "backdrop-blur-xl shadow-xl",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Your Wallet</h3>
                {onAddFunds && (
                    <button
                        onClick={onAddFunds}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                            "bg-gradient-to-r from-amber-500 to-yellow-500",
                            "text-black font-medium text-sm",
                            "hover:from-amber-400 hover:to-yellow-400",
                            "transition-all duration-200 hover:scale-105",
                            "shadow-lg shadow-amber-500/20"
                        )}
                    >
                        <IconPlus size={16} />
                        Add Funds
                    </button>
                )}
            </div>

            {/* Balances */}
            <div className="space-y-3">
                {/* Aether Balance */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-amber-500/10">
                    <div className="flex items-center gap-3">
                        <div className="relative size-10 flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
                            <IconCoin size={22} className="text-amber-400" />
                            <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-md animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Aether Credits</p>
                            <p className="text-xl font-bold text-white">
                                {formatBalance(balanceAether)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brain Balance */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-purple-500/10">
                    <div className="flex items-center gap-3">
                        <div className="relative size-10 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <span className="text-lg">🧠</span>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400">Brain Credits</p>
                            <p className="text-xl font-bold text-white">
                                {formatBalance(balanceBrain)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
