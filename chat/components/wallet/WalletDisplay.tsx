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
                    "bg-gradient-to-r from-rp-gold/10 to-rp-gold/5",
                    "border border-rp-gold/20 hover:border-rp-gold/40",
                    "transition-all duration-300 hover:scale-105",
                    "backdrop-blur-sm",
                    className
                )}
            >
                {/* Coin Icon with glow */}
                <div className="relative">
                    <IconCoin
                        size={18}
                        className="text-rp-gold animate-coin-glow"
                    />
                    <div className="absolute inset-0 rounded-full bg-rp-gold/20 blur-sm animate-pulse" />
                </div>

                {/* Balance */}
                <span className="text-sm font-semibold text-rp-gold">
                    {formatBalance(balanceAether)}
                </span>

                {/* Add indicator on hover */}
                <IconPlus
                    size={14}
                    className="text-rp-gold/0 group-hover:text-rp-gold transition-colors duration-200"
                />
            </button>
        )
    }

    // Expanded variant
    return (
        <div
            className={cn(
                "rounded-2xl p-5",
                "bg-rp-surface backdrop-blur-xl shadow-xl",
                "border border-rp-highlight-low",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-rp-text">Your Wallet</h3>
                {onAddFunds && (
                    <button
                        onClick={onAddFunds}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                            "bg-gradient-to-r from-rp-gold to-rp-iris",
                            "text-rp-base font-medium text-sm",
                            "hover:from-rp-gold/80 hover:to-rp-iris/80",
                            "transition-all duration-200 hover:scale-105",
                            "shadow-lg shadow-rp-gold/20"
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-rp-overlay border border-rp-gold/10">
                    <div className="flex items-center gap-3">
                        <div className="relative size-10 flex items-center justify-center rounded-full bg-gradient-to-br from-rp-gold/20 to-rp-iris/20">
                            <IconCoin size={22} className="text-rp-gold" />
                            <div className="absolute inset-0 rounded-full bg-rp-gold/10 blur-md animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-rp-subtle">Aether Credits</p>
                            <p className="text-xl font-bold text-rp-text">
                                {formatBalance(balanceAether)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brain Balance */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-rp-overlay border border-rp-iris/10">
                    <div className="flex items-center gap-3">
                        <div className="relative size-10 flex items-center justify-center rounded-full bg-gradient-to-br from-rp-iris/20 to-rp-rose/20">
                            <span className="text-lg">🧠</span>
                        </div>
                        <div>
                            <p className="text-xs text-rp-subtle">Brain Credits</p>
                            <p className="text-xl font-bold text-rp-text">
                                {formatBalance(balanceBrain)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
