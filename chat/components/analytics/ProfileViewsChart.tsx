'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfileViewsChartProps {
    data: { date: string; views: number }[];
}

export function ProfileViewsChart({ data }: ProfileViewsChartProps) {
    return (
        <div className="bg-rp-surface rounded-lg p-6 border border-rp-highlight-med">
            <h3 className="text-lg font-semibold text-rp-text mb-4">Profile Views</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
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
                            itemStyle={{ color: 'hsl(var(--rp-iris))' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="views"
                            stroke="hsl(var(--rp-iris))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--rp-iris))', r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
