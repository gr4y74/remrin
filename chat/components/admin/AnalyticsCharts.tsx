"use client"

import React from 'react'

interface DataPoint {
    date: string
    count: number
}

interface CategoryPoint {
    name: string
    value: number
}

/**
 * Messages Per Day Line Chart (SVG)
 */
export function MessagesChart({ data }: { data: DataPoint[] }) {
    if (!data || data.length === 0) {
        return <div className="h-48 flex items-center justify-center text-rp-muted italic">No data available</div>
    }

    const padding = 40
    const width = 800
    const height = 300

    const maxCount = Math.max(...data.map(d => d.count), 10)
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1 || 1)) * chartWidth
        const y = padding + chartHeight - (d.count / maxCount) * chartHeight
        return `${x},${y}`
    }).join(' ')

    return (
        <div className="w-full overflow-hidden rounded-xl bg-rp-surface p-4 border border-rp-highlight-med shadow-inner">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-lg">
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map(p => (
                    <line
                        key={p}
                        x1={padding}
                        y1={padding + p * chartHeight}
                        x2={width - padding}
                        y2={padding + p * chartHeight}
                        stroke="var(--rp-highlight-low)"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Path Gradient */}
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--rp-iris)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--rp-iris)" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* The Area */}
                <path
                    d={`M ${padding},${height - padding} ${points} L ${width - padding},${height - padding} Z`}
                    fill="url(#chartGradient)"
                />

                {/* The Line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--rp-iris)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data Points */}
                {data.map((d, i) => {
                    const x = padding + (i / (data.length - 1 || 1)) * chartWidth
                    const y = padding + chartHeight - (d.count / maxCount) * chartHeight
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="var(--rp-base)"
                            stroke="var(--rp-iris)"
                            strokeWidth="2"
                            className="hover:r-6 transition-all cursor-pointer"
                        >
                            <title>{`${d.date}: ${d.count} messages`}</title>
                        </circle>
                    )
                })}

                {/* Labels */}
                <text x={padding} y={height - 10} fill="var(--rp-muted)" fontSize="10">{data[0].date}</text>
                <text x={width - padding} y={height - 10} fill="var(--rp-muted)" fontSize="10" textAnchor="end">{data[data.length - 1].date}</text>
                <text x={10} y={padding} fill="var(--rp-muted)" fontSize="10">{maxCount}</text>
            </svg>
        </div>
    )
}

/**
 * Category Popularity Bar Chart (SVG)
 */
export function CategoryChart({ data }: { data: CategoryPoint[] }) {
    if (!data || data.length === 0) {
        return <div className="h-48 flex items-center justify-center text-rp-muted italic">No data available</div>
    }

    const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 8)
    const maxValue = Math.max(...sortedData.map(d => d.value), 1)

    return (
        <div className="w-full space-y-4 rounded-xl bg-rp-surface p-6 border border-rp-highlight-med shadow-inner">
            <h3 className="text-sm font-bold text-rp-subtle uppercase tracking-wider mb-2">Popularity by Category</h3>
            <div className="space-y-3">
                {sortedData.map((d, i) => {
                    const percentage = (d.value / maxValue) * 100
                    const colors = ["bg-rp-iris", "bg-rp-rose", "bg-rp-gold", "bg-rp-foam", "bg-rp-pine", "bg-rp-love"]
                    const color = colors[i % colors.length]

                    return (
                        <div key={d.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-rp-text">{d.name}</span>
                                <span className="text-rp-muted">{d.value.toLocaleString()} chats</span>
                            </div>
                            <div className="h-2 w-full bg-rp-highlight-low rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${color} transition-all duration-1000 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
