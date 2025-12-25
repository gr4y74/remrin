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
                        className="flex animate-pulse items-center gap-4 rounded-xl bg-white/5 p-4"
                    >
                        <div className="size-10 rounded-full bg-white/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 rounded bg-white/10" />
                            <div className="h-3 w-20 rounded bg-white/10" />
                        </div>
                        <div className="h-5 w-16 rounded bg-white/10" />
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
                <div className="bg-rp-overlay mb-4 flex size-16 items-center justify-center rounded-full">
                    <IconWallet size={32} className="text-rp-muted" />
                </div>
                <h3 className="text-rp-text mb-1 text-lg font-semibold">No transactions yet</h3>
                <p className="text-rp-muted text-sm">
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
                            "flex items-center gap-4 rounded-xl p-4",
                            "bg-rp-overlay border-rp-muted/20 border",
                            "hover:bg-rp-overlay/80 transition-all duration-200"
                        )}
                    >
                        {/* Icon */}
                        <div className={cn(
                            "flex size-10 items-center justify-center rounded-full",
                            config.bgColor
                        )}>
                            <Icon size={20} className={config.color} />
                        </div>

                        {/* Description & Date */}
                        <div className="min-w-0 flex-1">
                            <p className="text-rp-text truncate text-sm font-medium">
                                {transaction.description}
                            </p>
                            <p className="text-rp-muted text-xs">
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
                    className="text-rp-subtle hover:text-rp-text mt-4 w-full"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <div className="border-rp-muted/30 border-t-rp-iris size-4 animate-spin rounded-full border-2" />
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
