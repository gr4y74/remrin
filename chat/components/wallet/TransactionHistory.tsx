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
    purchase: { icon: IconShoppingCart, color: "text-red-400", bgColor: "bg-red-500/10" },
    sale: { icon: IconArrowDown, color: "text-green-400", bgColor: "bg-green-500/10" },
    topup: { icon: IconWallet, color: "text-amber-400", bgColor: "bg-amber-500/10" },
    gift: { icon: IconGift, color: "text-purple-400", bgColor: "bg-purple-500/10" },
    refund: { icon: IconArrowUp, color: "text-blue-400", bgColor: "bg-blue-500/10" }
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
                <div className="size-16 flex items-center justify-center rounded-full bg-white/5 mb-4">
                    <IconWallet size={32} className="text-zinc-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No transactions yet</h3>
                <p className="text-sm text-zinc-500">
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
                            "bg-white/5 border border-white/5",
                            "transition-all duration-200 hover:bg-white/[0.07]"
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
                            <p className="text-sm font-medium text-white truncate">
                                {transaction.description}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {formatDate(transaction.created_at)}
                            </p>
                        </div>

                        {/* Amount */}
                        <span className={cn(
                            "text-sm font-semibold",
                            isPositive ? "text-green-400" : "text-red-400"
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
                    className="w-full mt-4 text-zinc-400 hover:text-white"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <div className="size-4 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
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
