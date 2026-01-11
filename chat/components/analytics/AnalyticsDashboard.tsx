'use client';
import { Download, ChevronDown, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { ProfileViewsChart } from './ProfileViewsChart';
import { EngagementChart } from './EngagementChart';
import { FollowerGrowthChart } from './FollowerGrowthChart';
import { TopContentCard } from './TopContentCard';
import { ActivityHeatmap } from './ActivityHeatmap';
import { InsightsPanel } from './InsightsPanel';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function AnalyticsDashboard() {
    const { data, loading } = useAnalytics();

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rp-iris"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-rp-text">Analytics Dashboard</h1>
                    <p className="text-rp-subtle mt-1">Track your performance and growth metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-rp-surface border border-rp-highlight-med rounded-lg text-rp-text hover:bg-rp-overlay transition-colors">
                        <Filter size={18} />
                        Last 30 Days
                        <ChevronDown size={14} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-rp-iris text-rp-base font-semibold rounded-lg hover:opacity-90 transition-opacity">
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.overview.map((item: any, idx: number) => (
                    <div key={idx} className="bg-rp-surface p-6 rounded-lg border border-rp-highlight-med">
                        <p className="text-sm text-rp-subtle">{item.label}</p>
                        <div className="flex items-end justify-between mt-2">
                            <h2 className="text-2xl font-bold text-rp-text">{item.value}</h2>
                            <span className={`flex items-center gap-1 text-xs font-medium ${item.positive ? 'text-rp-foam' : 'text-rp-love'}`}>
                                {item.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                {item.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <ProfileViewsChart data={data.profileViews} />
                </div>
                <div className="lg:col-span-1">
                    <EngagementChart data={data.engagement} />
                </div>
            </div>

            {/* Secondary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FollowerGrowthChart data={data.followerGrowth} />
                <TopContentCard posts={data.topContent} />
            </div>

            {/* Heatmap and Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <ActivityHeatmap data={data.activity} />
                </div>
                <div className="lg:col-span-2">
                    <InsightsPanel insights={data.insights} />
                </div>
            </div>
        </div>
    );
}
