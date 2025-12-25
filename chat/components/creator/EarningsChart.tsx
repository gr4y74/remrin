"use client"

import { useMemo } from "react"

interface DailySale {
    date: string
    amount: number
    count: number
}

interface EarningsChartProps {
    data: DailySale[]
    className?: string
}

export function EarningsChart({ data, className = "" }: EarningsChartProps) {
    const maxAmount = useMemo(() => {
        return Math.max(...data.map((d) => d.amount), 1)
    }, [data])

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString("en-US", { weekday: "short" })
    }

    return (
        <div className={`rounded-xl border border-rp-muted/20 bg-rp-surface p-4 ${className}`}>
            <h3 className="mb-4 text-sm font-medium text-rp-subtle">
                Last 7 Days
            </h3>

            <div className="flex h-32 items-end justify-between gap-2">
                {data.map((day, index) => {
                    const height = (day.amount / maxAmount) * 100
                    return (
                        <div
                            key={day.date}
                            className="flex flex-1 flex-col items-center gap-1"
                        >
                            {/* Tooltip on hover */}
                            <div className="group relative flex-1 w-full flex items-end">
                                <div
                                    className="w-full rounded-t-md bg-gradient-to-t from-rp-iris to-rp-rose transition-all duration-500 ease-out hover:from-rp-iris/80 hover:to-rp-rose/80"
                                    style={{
                                        height: `${Math.max(height, 4)}%`,
                                        animationDelay: `${index * 75}ms`
                                    }}
                                />
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-rp-base px-2 py-1 text-xs text-rp-text shadow-lg group-hover:block">
                                    <span className="font-semibold text-rp-iris">
                                        {day.amount.toLocaleString()}
                                    </span>{" "}
                                    Aether
                                    <br />
                                    <span className="text-rp-subtle">
                                        {day.count} sales
                                    </span>
                                </div>
                            </div>

                            {/* Day label */}
                            <span className="text-[10px] text-rp-muted">
                                {formatDate(day.date)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
