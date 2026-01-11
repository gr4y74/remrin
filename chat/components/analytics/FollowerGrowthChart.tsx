'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FollowerGrowthChartProps {
    data: { date: string; followers: number }[];
}

export function FollowerGrowthChart({ data }: FollowerGrowthChartProps) {
    return (
        <div className="bg-rp-surface rounded-lg p-6 border border-rp-highlight-med">
            <h3 className="text-lg font-semibold text-rp-text mb-4">Follower Growth</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--rp-foam))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--rp-foam))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--rp-highlight-low))" />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--rp-subtle))"
                            tick={{ fill: 'hsl(var(--rp-subtle))' }}
                            fontSize={12}
                        />
                        <YAxis
                            stroke="hsl(var(--rp-subtle))"
                            tick={{ fill: 'hsl(var(--rp-subtle))' }}
                            fontSize={12}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--rp-overlay))',
                                border: '1px solid hsl(var(--rp-highlight-med))',
                                borderRadius: '8px',
                                color: 'hsl(var(--rp-text))'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="followers"
                            stroke="hsl(var(--rp-foam))"
                            fillOpacity={1}
                            fill="url(#colorFollowers)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
