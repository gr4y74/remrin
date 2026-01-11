'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EngagementChartProps {
    data: {
        name: string;
        likes: number;
        comments: number;
        shares: number;
    }[];
}

export function EngagementChart({ data }: EngagementChartProps) {
    return (
        <div className="bg-rp-surface rounded-lg p-6 border border-rp-highlight-med">
            <h3 className="text-lg font-semibold text-rp-text mb-4">Engagement Distribution</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--rp-highlight-low))" />
                        <XAxis
                            dataKey="name"
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
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="likes" stackId="a" fill="hsl(var(--rp-love))" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="comments" stackId="a" fill="hsl(var(--rp-gold))" />
                        <Bar dataKey="shares" stackId="a" fill="hsl(var(--rp-pine))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
