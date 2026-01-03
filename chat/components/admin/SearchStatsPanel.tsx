'use client'

import { useEffect, useState } from 'react'
import {
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

interface SearchStats {
    totalSearches: number
    todaySearches: number
    weekSearches: number
    monthSearches: number
    providerDistribution: Array<{
        provider: string
        count: number
        percentage: number
    }>
    successRate: {
        overall: number
        byProvider: Record<string, number>
    }
    averageResponseTime: {
        overall: number
        byProvider: Record<string, number>
    }
    recentQueries: Array<{
        query: string
        provider: string
        success: boolean
        response_time_ms: number
        created_at: string
    }>
    providerHealth: Array<{
        provider: string
        enabled: boolean
        success_count: number
        failure_count: number
        success_rate: number
        avg_response_time: number
        last_success_at: string | null
        last_failure_at: string | null
    }>
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function SearchStatsPanel() {
    const [stats, setStats] = useState<SearchStats | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [autoRefresh, setAutoRefresh] = useState(true)

    const fetchStats = async () => {
        try {
            const adminPassword = sessionStorage.getItem('admin_password')
            const response = await fetch('/api/admin/search-stats', {
                headers: {
                    'x-admin-password': adminPassword || ''
                }
            })

            if (!response.ok) {
                const errorData = await response.json()
                if (errorData.error?.includes('relation') || errorData.error?.includes('not found')) {
                    throw new Error('Database tables not found. Please apply the migration in supabase/migrations/20250103_add_search_provider_config.sql')
                }
                throw new Error(errorData.error || 'Failed to fetch stats')
            }

            const data = await response.json()
            setStats(data)
            setError(null)
        } catch (error: any) {
            console.error('Error fetching search stats:', error)
            setError(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()

        if (autoRefresh) {
            const interval = setInterval(fetchStats, 30000) // Refresh every 30s
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
                <p className="mb-2 font-semibold text-red-400">Error</p>
                <p className="text-white/60">{error}</p>
                <button
                    onClick={() => {
                        setError(null)
                        setIsLoading(true)
                        fetchStats()
                    }}
                    className="mt-4 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30"
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-white/60">No search statistics available</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Auto-Refresh Toggle */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Search Statistics</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
                    >
                        🔄 Refresh
                    </button>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${autoRefresh
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'border border-white/20 text-white/60 hover:bg-white/5'
                            }`}
                    >
                        {autoRefresh ? '● Live' : '○ Paused'}
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6">
                    <div className="mb-2 text-sm font-medium text-white/60">
                        Total Searches
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {(stats.totalSearches || 0).toLocaleString()}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-6">
                    <div className="mb-2 text-sm font-medium text-white/60">Today</div>
                    <div className="text-3xl font-bold text-white">
                        {(stats.todaySearches || 0).toLocaleString()}
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6">
                    <div className="mb-2 text-sm font-medium text-white/60">
                        Success Rate
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {(stats.successRate?.overall || 0).toFixed(1)}%
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6">
                    <div className="mb-2 text-sm font-medium text-white/60">
                        Avg Response
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {(stats.averageResponseTime?.overall || 0).toFixed(0)}ms
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Provider Distribution Pie Chart */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                        Provider Usage Distribution
                    </h3>
                    {stats.providerDistribution?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.providerDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="provider"
                                >
                                    {stats.providerDistribution.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-[300px] items-center justify-center text-white/40">
                            No distribution data available
                        </div>
                    )}
                </div>

                {/* Provider Health Table */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                        Provider Health
                    </h3>
                    <div className="space-y-3">
                        {(stats.providerHealth || []).map((provider) => (
                            <div
                                key={provider.provider}
                                className="rounded-lg border border-white/10 bg-white/5 p-4"
                            >
                                <div className="mb-2 flex items-center justify-between">
                                    <span className="font-medium capitalize text-white">
                                        {provider.provider}
                                    </span>
                                    <span
                                        className={`text-sm ${provider.enabled ? 'text-green-400' : 'text-red-400'
                                            }`}
                                    >
                                        {provider.enabled ? '● Active' : '○ Disabled'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-white/60">Success Rate:</span>
                                        <span className="ml-2 font-medium text-white">
                                            {(provider.success_rate || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-white/60">Avg Time:</span>
                                        <span className="ml-2 font-medium text-white">
                                            {(provider.avg_response_time || 0).toFixed(0)}ms
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!stats.providerHealth || stats.providerHealth.length === 0) && (
                            <div className="py-8 text-center text-white/40">
                                No provider health data
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Queries Log */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-semibold text-white">
                    Recent Search Queries
                </h3>
                <div className="space-y-2">
                    {stats.recentQueries?.length > 0 ? (
                        stats.recentQueries.map((query, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-white">{query.query}</div>
                                    <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
                                        <span className="capitalize">{query.provider}</span>
                                        <span>•</span>
                                        <span>{query.response_time_ms}ms</span>
                                        <span>•</span>
                                        <span>
                                            {new Date(query.created_at).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${query.success
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-red-500/20 text-red-400'
                                        }`}
                                >
                                    {query.success ? 'Success' : 'Failed'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center text-white/40">
                            No recent queries
                        </div>
                    )}
                </div>
            </div>

            {/* Time-based Stats */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-2 text-sm text-white/60">This Week</div>
                    <div className="text-2xl font-bold text-white">
                        {(stats.weekSearches || 0).toLocaleString()}
                    </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-2 text-sm text-white/60">This Month</div>
                    <div className="text-2xl font-bold text-white">
                        {(stats.monthSearches || 0).toLocaleString()}
                    </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-2 text-sm text-white/60">Average Daily</div>
                    <div className="text-2xl font-bold text-white">
                        {(stats.monthSearches / 30 || 0).toFixed(0)}
                    </div>
                </div>
            </div>
        </div>
    )
}
