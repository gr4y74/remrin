"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    IconArrowLeft,
    IconChartLine,
    IconUsers,
    IconMessage,
    IconTrophy,
    IconActivity,
    IconRefresh
} from '@tabler/icons-react'
import Image from "next/image"
import { AdminPasswordGate } from '@/components/admin/AdminPasswordGate'
import dynamic from 'next/dynamic'
// import { MessagesChart, CategoryChart } from '@/components/admin/AnalyticsCharts'

const MessagesChart = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((mod) => mod.MessagesChart),
    { loading: () => <div className="h-[300px] w-full animate-pulse rounded-lg bg-rp-highlight-low" /> }
)
const CategoryChart = dynamic(
    () => import('@/components/admin/AnalyticsCharts').then((mod) => mod.CategoryChart),
    { loading: () => <div className="h-[300px] w-full animate-pulse rounded-lg bg-rp-highlight-low" /> }
)
import { cn } from '@/lib/utils'

interface AnalyticsData {
    metrics: {
        totalChats: number
        totalMessages: number
        activeUsers: number
    }
    topSouls: {
        id: string
        name: string
        image: string
        chats: number
    }[]
    recentActivity: {
        content: string
        timestamp: string
        username: string
        soulName: string
    }[]
    charts: {
        messagesPerDay: { date: string, count: number }[]
        categoryDistribution: { name: string, value: number }[]
    }
}

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    async function fetchAnalytics() {
        setLoading(true)
        setError(null)
        try {
            const adminPassword = sessionStorage.getItem("admin_password") || ""

            const response = await fetch('/api/admin/analytics', {
                headers: {
                    'x-admin-password': adminPassword
                }
            })
            if (!response.ok) throw new Error('Failed to fetch analytics data')
            const result = await response.json()
            setData(result)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !data) {
        return (
            <AdminPasswordGate>
                <div className="flex min-h-screen items-center justify-center bg-rp-base">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rp-highlight-med border-t-rp-iris" />
                        <p className="text-rp-muted animate-pulse font-medium">Crunching usage data...</p>
                    </div>
                </div>
            </AdminPasswordGate>
        )
    }

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text pb-20">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-rp-highlight-med bg-rp-base/80 px-6 py-4 backdrop-blur-md">
                    <div className="flex items-center justify-between mx-auto max-w-7xl">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                            >
                                <IconArrowLeft size={20} />
                                Back
                            </Link>
                            <div className="h-6 w-px bg-rp-highlight-med" />
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <IconChartLine className="text-rp-iris" />
                                Usage Analytics
                            </h1>
                        </div>
                        <button
                            onClick={fetchAnalytics}
                            className="flex items-center gap-2 rounded-lg bg-rp-surface px-4 py-2 text-sm font-medium border border-rp-highlight-med transition-all hover:bg-rp-overlay active:scale-95"
                        >
                            <IconRefresh size={16} className={loading ? "animate-spin" : ""} />
                            Refresh
                        </button>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl p-6 space-y-8 animate-in fade-in duration-500">
                    {error && (
                        <div className="rounded-lg border border-rp-love bg-rp-love/10 p-4 text-rp-love">
                            Error: {error}
                        </div>
                    )}

                    {/* Stats Overview */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <StatCard
                            title="Total Chats"
                            value={data?.metrics.totalChats.toLocaleString() || '0'}
                            icon={<IconMessage size={32} />}
                            color="text-rp-iris"
                            bgColor="bg-rp-iris/10"
                        />
                        <StatCard
                            title="Total Messages"
                            value={data?.metrics.totalMessages.toLocaleString() || '0'}
                            icon={<IconActivity size={32} />}
                            color="text-rp-pine"
                            bgColor="bg-rp-pine/10"
                        />
                        <StatCard
                            title="Active Users (30d)"
                            value={data?.metrics.activeUsers.toLocaleString() || '0'}
                            icon={<IconUsers size={32} />}
                            color="text-rp-rose"
                            bgColor="bg-rp-rose/10"
                        />
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Messages History Chart */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 px-1">
                                <IconActivity className="text-rp-iris" size={20} />
                                Message Volume (Last 30 Days)
                            </h2>
                            <MessagesChart data={data?.charts.messagesPerDay || []} />
                        </div>

                        {/* Category Popularity */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 px-1">
                                <IconTrophy className="text-rp-gold" size={20} />
                                Top Categories
                            </h2>
                            <CategoryChart data={data?.charts.categoryDistribution || []} />
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Top Souls Leaderboard */}
                        <div className="lg:col-span-1 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 px-1">
                                <IconTrophy className="text-rp-gold" size={20} />
                                Top Performing Souls
                            </h2>
                            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface overflow-hidden shadow-sm">
                                <div className="divide-y divide-rp-highlight-low">
                                    {data?.topSouls.map((soul, i) => (
                                        <div key={soul.id} className="flex items-center gap-4 p-4 hover:bg-rp-overlay/50 transition-colors">
                                            <div className="flex-shrink-0 w-8 text-center font-bold text-rp-subtle">
                                                #{i + 1}
                                            </div>
                                            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-rp-highlight-med bg-rp-base">
                                                {soul.image ? (
                                                    <Image
                                                        src={soul.image}
                                                        alt={soul.name}
                                                        className="object-cover"
                                                        fill
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-rp-highlight-low text-rp-muted">
                                                        {soul.name[0]}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-rp-text truncate">{soul.name}</div>
                                                <div className="text-xs text-rp-muted">{soul.chats.toLocaleString()} chats</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data?.topSouls || data.topSouls.length === 0) && (
                                        <div className="p-8 text-center text-rp-muted italic text-sm">No soul data found</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity Stream */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 px-1">
                                <IconActivity className="text-rp-rose" size={20} />
                                Live Interaction Feed
                            </h2>
                            <div className="rounded-xl border border-rp-highlight-med bg-rp-surface overflow-hidden shadow-sm">
                                <div className="divide-y divide-rp-highlight-low max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {data?.recentActivity.map((activity, i) => (
                                        <div key={i} className="p-4 hover:bg-rp-overlay/30 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-rp-iris text-sm">{activity.username}</span>
                                                    <span className="text-rp-muted text-[10px] uppercase">interacted with</span>
                                                    <span className="font-bold text-rp-pine text-sm">{activity.soulName}</span>
                                                </div>
                                                <span className="text-[10px] text-rp-muted">
                                                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-rp-subtle line-clamp-2 italic">
                                                &quot;{activity.content}&quot;
                                            </p>
                                        </div>
                                    ))}
                                    {(!data?.recentActivity || data.recentActivity.length === 0) && (
                                        <div className="p-12 text-center text-rp-muted italic">No recent activity</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </AdminPasswordGate>
    )
}

function StatCard({ title, value, icon, color, bgColor }: { title: string, value: string, icon: React.ReactNode, color: string, bgColor: string }) {
    return (
        <div className="rounded-2xl border border-rp-highlight-med bg-rp-surface p-6 shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-rp-muted uppercase tracking-wider mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-rp-text tracking-tight">{value}</h3>
                </div>
                <div className={cn("rounded-xl p-3", bgColor, color)}>
                    {icon}
                </div>
            </div>
        </div>
    )
}
