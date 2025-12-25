"use client"

import { cn } from "@/lib/utils"
import {
    IconArrowDown,
    IconArrowUp,
    IconShoppingCart,
    IconWallet,
    IconGift
} from "@tabler/icons-react"
import { FC, useState } from "react"
import { Button } from "@/components/ui/button"

export interface Transaction {
    id: string
    type: "purchase" | "sale" | "topup" | "gift" | "refund"
    amount: number
    description: string
    created_at: string
}

interface TransactionHistoryProps {
    transactions: Transaction[]
    loading?: boolean
    hasMore?: boolean
    onLoadMore?: () => void
    className?: string
}

const TRANSACTION_ICONS = {
    purchase: { icon: IconShoppingCart, color: "text-rp-love", bgColor: "bg-rp-love/10" },
    sale: { icon: IconArrowDown, color: "text-rp-foam", bgColor: "bg-rp-foam/10" },
    topup: { icon: IconWallet, color: "text-rp-gold", bgColor: "bg-rp-gold/10" },
    gift: { icon: IconGift, color: "text-rp-iris", bgColor: "bg-rp-iris/10" },
    refund: { icon: IconArrowUp, color: "text-rp-pine", bgColor: "bg-rp-pine/10" }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
        return "Today"
    } else if (days === 1) {
        return "Yesterday"
    } else if (days < 7) {
        return `${days} days ago`
    } else {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
        })
    }
}

function formatAmount(amount: number, type: Transaction["type"]): string {
    const isPositive = type === "sale" || type === "topup" || type === "refund"
    return `${isPositive ? "+" : "-"}${Math.abs(amount).toLocaleString()}`
}

export const TransactionHistory: FC<TransactionHistoryProps> = ({
    transactions,
    loading = false,
    hasMore = false,
    onLoadMore,
    className
}) => {
    if (loading && transactions.length === 0) {
        return (
            <div className={cn("space-y-3", className)}>
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 animate-pulse"
                    >
                        <div className="size-10 rounded-full bg-white/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-white/10 rounded" />
                            <div className="h-3 w-20 bg-white/10 rounded" />
                        </div>
                        <div className="h-5 w-16 bg-white/10 rounded" />
                    </div>
                ))}
            </div>
        )
    }

    if (transactions.length === 0) {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center py-12 text-center",
                className
            )}>
                <div className="size-16 flex items-center justify-center rounded-full bg-rp-overlay mb-4">
                    <IconWallet size={32} className="text-rp-muted" />
                </div>
                <h3 className="text-lg font-semibold text-rp-text mb-1">No transactions yet</h3>
                <p className="text-sm text-rp-muted">
                    Your transaction history will appear here
                </p>
            </div>
        )
    }

    return (
        <div className={cn("space-y-2", className)}>
            {transactions.map((transaction) => {
                const config = TRANSACTION_ICONS[transaction.type]
                const Icon = config.icon
                const isPositive = ["sale", "topup", "refund"].includes(transaction.type)

                return (
                    <div
                        key={transaction.id}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-xl",
                            "bg-rp-overlay border border-rp-muted/20",
                            "transition-all duration-200 hover:bg-rp-overlay/80"
                        )}
                    >
                        {/* Icon */}
                        <div className={cn(
                            "size-10 flex items-center justify-center rounded-full",
                            config.bgColor
                        )}>
                            <Icon size={20} className={config.color} />
                        </div>

                        {/* Description & Date */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-rp-text truncate">
                                {transaction.description}
                            </p>
                            <p className="text-xs text-rp-muted">
                                {formatDate(transaction.created_at)}
                            </p>
                        </div>

                        {/* Amount */}
                        <span className={cn(
                            "text-sm font-semibold",
                            isPositive ? "text-rp-foam" : "text-rp-love"
                        )}>
                            {formatAmount(transaction.amount, transaction.type)}
                        </span>
                    </div>
                )
            })}

            {/* Load More */}
            {hasMore && (
                <Button
                    variant="ghost"
                    onClick={onLoadMore}
                    disabled={loading}
                    className="w-full mt-4 text-rp-subtle hover:text-rp-text"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <div className="size-4 border-2 border-rp-muted/30 border-t-rp-iris rounded-full animate-spin" />
                            Loading...
                        </span>
                    ) : (
                        "Load More"
                    )}
                </Button>
            )}
        </div>
    )
}
