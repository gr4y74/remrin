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
                    "from-rp-gold/10 to-rp-gold/5 bg-gradient-to-r",
                    "border-rp-gold/20 hover:border-rp-gold/40 border",
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
                    <div className="bg-rp-gold/20 absolute inset-0 animate-pulse rounded-full blur-sm" />
                </div>

                {/* Balance */}
                <span className="text-rp-gold text-sm font-semibold">
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
                "bg-rp-surface shadow-xl backdrop-blur-xl",
                "border-rp-highlight-low border",
                className
            )}
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-rp-text text-lg font-semibold">Your Wallet</h3>
                {onAddFunds && (
                    <button
                        onClick={onAddFunds}
                        className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                            "from-rp-gold to-rp-iris bg-gradient-to-r",
                            "text-rp-base text-sm font-medium",
                            "hover:from-rp-gold/80 hover:to-rp-iris/80",
                            "transition-all duration-200 hover:scale-105",
                            "shadow-rp-gold/20 shadow-lg"
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
                <div className="bg-rp-overlay border-rp-gold/10 flex items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                        <div className="from-rp-gold/20 to-rp-iris/20 relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br">
                            <IconCoin size={22} className="text-rp-gold" />
                            <div className="bg-rp-gold/10 absolute inset-0 animate-pulse rounded-full blur-md" />
                        </div>
                        <div>
                            <p className="text-rp-subtle text-xs">Aether Credits</p>
                            <p className="text-rp-text text-xl font-bold">
                                {formatBalance(balanceAether)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brain Balance */}
                <div className="bg-rp-overlay border-rp-iris/10 flex items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3">
                        <div className="from-rp-iris/20 to-rp-rose/20 relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br">
                            <span className="text-lg">🧠</span>
                        </div>
                        <div>
                            <p className="text-rp-subtle text-xs">Brain Credits</p>
                            <p className="text-rp-text text-xl font-bold">
                                {formatBalance(balanceBrain)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
