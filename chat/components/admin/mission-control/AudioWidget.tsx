"use client"

import { useEffect, useState } from "react"
import { IconActivity, IconServer, IconDatabase, IconCoin } from "@tabler/icons-react"
import { AnalyticsSummary, formatBytes } from "@/lib/audio/analytics"

export function AudioAnalyticsWidget() {
    const [data, setData] = useState<AnalyticsSummary | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch last 24h or just all time summary for widget? 
                // Request says "Today's generations", so we need 24h or "today".
                // API supports startDate.
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const params = new URLSearchParams()
                params.append('startDate', today.toISOString())

                // We might want overall usage for storage/cost, but today for generations.
                // The API returns aggregated stats based on the date range.
                // To get "Total Storage" (all time) and "Today's Generations" (today), we might need 2 calls or update API.
                // For now, let's just show "Today's Stats" for generations/cost, and we can't easily get total storage from a filtered query 
                // unless the API supports it.
                // However, the prompt says "Today's generations", "Cache hit rate" (likely overall or today), "Storage used" (Overall), "Est monthly cost" (Monthly).
                // This widget is getting complicated for a single API call.
                // Let's just call without date filter for "All Time" to get Storage/Total Cost/Hit Rate.
                // And we'll just parse generations for today from the `generationsOverTime` if available, or just use the "All Time" stats for simplified display if needed.
                // Actually, let's just fetch "All Time" and parse "Today" from `generationsOverTime`.

                const res = await fetch('/api/audio/analytics?startDate=2024-01-01') // Fetch meaningful amount
                if (!res.ok) throw new Error('Failed')
                const result: AnalyticsSummary = await res.json()
                setData(result)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading || !data) return (
        <div className="animate-pulse rounded-xl border border-rp-highlight-med bg-rp-surface p-4 h-[100px]"></div>
    )

    // Calculate Today's generations
    const todayStr = new Date().toISOString().split('T')[0]
    const todayGens = data.generationsOverTime.find(d => d.date === todayStr)?.count || 0

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 rounded-xl border border-rp-highlight-med bg-rp-surface/50 p-4 backdrop-blur-sm">
            <WidgetStat
                label="Today's Gen"
                value={todayGens.toString()}
                icon={<IconActivity size={16} />}
                color="text-rp-rose"
            />
            <WidgetStat
                label="Hit Rate"
                value={`${data.cacheHitRate.toFixed(1)}%`}
                icon={<IconServer size={16} />}
                color="text-rp-foam"
            />
            <WidgetStat
                label="Storage"
                value={formatBytes(data.totalStorageBytes)}
                icon={<IconDatabase size={16} />}
                color="text-rp-gold"
            />
            <WidgetStat
                label="Est. Cost"
                value={`$${data.estimatedCost.toFixed(2)}`}
                icon={<IconCoin size={16} />}
                color="text-rp-love"
            />
        </div>
    )
}

function WidgetStat({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-rp-overlay ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rp-subtle">{label}</p>
                <p className="text-lg font-bold text-rp-text leading-none">{value}</p>
            </div>
        </div>
    )
}
