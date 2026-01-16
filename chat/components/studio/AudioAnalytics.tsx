"use client"

import { useEffect, useState } from "react"
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts"
import { IconServer, IconDatabase, IconCoin, IconActivity, IconRefresh } from "@tabler/icons-react"
import { AnalyticsSummary, formatBytes } from "@/lib/audio/analytics"
import { format } from "date-fns"

const COLORS = ['#eb6f92', '#31748f', '#9ccfd8', '#c4a7e7', '#f6c177']

export function AudioAnalytics() {
    const [data, setData] = useState<AnalyticsSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dateRange, setDateRange] = useState('30d')

    const fetchData = async () => {
        setLoading(true)
        setError(null)
        try {
            const today = new Date()
            let startDate = new Date()

            if (dateRange === '7d') startDate.setDate(today.getDate() - 7)
            else if (dateRange === '30d') startDate.setDate(today.getDate() - 30)
            else if (dateRange === '90d') startDate.setDate(today.getDate() - 90)

            const params = new URLSearchParams()
            if (dateRange !== 'all') {
                params.append('startDate', startDate.toISOString())
            }

            const res = await fetch(`/api/audio/analytics?${params.toString()}`)
            if (!res.ok) throw new Error('Failed to fetch analytics')

            const result = await res.json()
            setData(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange])

    if (loading && !data) {
        return (
            <div className="flex h-64 items-center justify-center rounded-xl border border-rp-highlight-med bg-rp-surface p-8">
                <IconRefresh className="animate-spin text-rp-muted" size={24} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">
                Error: {error}
            </div>
        )
    }

    if (!data) return null

    // Prepare Pie Chart Data
    const providerData = Object.entries(data.providerUsage).map(([name, value]) => ({ name, value }))

    // Prepare Gauge Data (Cache Efficiency)
    const gaugeData = [
        { name: 'Hits', value: data.cacheHitRate, fill: '#9ccfd8' },
        { name: 'Misses', value: 100 - data.cacheHitRate, fill: '#26233a' }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-rp-text">Audio Studio Analytics</h2>
                <div className="flex items-center gap-2 rounded-lg border border-rp-highlight-med bg-rp-overlay p-1">
                    {['7d', '30d', '90d', 'all'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${dateRange === range
                                ? 'bg-rp-iris text-rp-base'
                                : 'text-rp-subtle hover:text-rp-text hover:bg-rp-surface'
                                }`}
                        >
                            {range.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                    title="Total Generations"
                    value={data.totalGenerations.toLocaleString()}
                    icon={<IconActivity size={20} />}
                    color="text-rp-rose"
                    subValue={`${data.totalRequests.toLocaleString()} requests`}
                />
                <StatCard
                    title="Cache Hit Rate"
                    value={`${data.cacheHitRate.toFixed(1)}%`}
                    icon={<IconServer size={20} />}
                    color="text-rp-foam"
                    subValue="Efficiency"
                />
                <StatCard
                    title="Storage Used"
                    value={formatBytes(data.totalStorageBytes)}
                    icon={<IconDatabase size={20} />}
                    color="text-rp-gold"
                    subValue="Cached Files"
                />
                <StatCard
                    title="Est. Monthly Cost"
                    value={`$${data.estimatedCost.toFixed(2)}`}
                    icon={<IconCoin size={20} />}
                    color="text-rp-love"
                    subValue="Based on usage"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Generations Over Time */}
                <ChartCard title="Generations Over Time">
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data.generationsOverTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#26233a" />
                            <XAxis
                                dataKey="date"
                                stroke="#908caa"
                                fontSize={12}
                                tickFormatter={(str) => format(new Date(str), 'MMM d')}
                            />
                            <YAxis stroke="#908caa" fontSize={12} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#191724', border: '1px solid #26233a', borderRadius: '8px' }}
                                labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                            />
                            <Line type="monotone" dataKey="count" stroke="#c4a7e7" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Provider Usage */}
                <ChartCard title="Provider Usage">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={providerData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {providerData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#191724', border: '1px solid #26233a', borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Top Voices */}
                <ChartCard title="Top Voices">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={data.topVoices} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#26233a" horizontal={false} />
                            <XAxis type="number" stroke="#908caa" fontSize={12} />
                            <YAxis dataKey="voice_id" type="category" width={100} stroke="#908caa" fontSize={11} interval={0} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{ backgroundColor: '#191724', border: '1px solid #26233a', borderRadius: '8px' }}
                            />
                            <Bar dataKey="count" fill="#eb6f92" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Cache Efficiency Gauge */}
                <ChartCard title="Cache Efficiency">
                    <div className="relative flex h-[250px] items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={20} data={gaugeData} startAngle={180} endAngle={0} cx="50%" cy="75%">
                                <RadialBar
                                    label={{ position: 'insideStart', fill: '#fff' }}
                                    background
                                    dataKey="value"
                                    cornerRadius={10}
                                />
                                <Legend iconSize={10} layout="vertical" verticalAlign="bottom" align="right" />
                                <Tooltip contentStyle={{ backgroundColor: '#191724', border: '1px solid #26233a', borderRadius: '8px' }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute top-[65%] text-center">
                            <div className="text-3xl font-bold text-rp-text">{data.cacheHitRate.toFixed(1)}%</div>
                            <div className="text-xs text-rp-subtle">Hit Rate</div>
                        </div>
                    </div>
                </ChartCard>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, color, subValue }: { title: string, value: string, icon: React.ReactNode, color: string, subValue: string }) {
    return (
        <div className="group rounded-xl border border-rp-highlight-med bg-rp-surface p-4 transition-all hover:border-rp-highlight-high hover:bg-rp-overlay">
            <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-rp-overlay ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-rp-subtle">{title}</p>
                <p className="mt-1 text-2xl font-bold text-rp-text">{value}</p>
                <p className="text-xs text-rp-muted">{subValue}</p>
            </div>
        </div>
    )
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-rp-subtle">{title}</h3>
            {children}
        </div>
    )
}
