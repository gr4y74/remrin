import { NextRequest, NextResponse } from 'next/server';
import { ProfileAnalytics } from '@/lib/analytics/ProfileAnalytics';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const period = searchParams.get('period') || 'all';

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const analytics = new ProfileAnalytics();

        const [timeOnPlatform, creationStats, engagementMetrics, heatmap] = await Promise.all([
            analytics.getTimeOnPlatform(userId, period as any),
            analytics.getCreationStats(userId),
            analytics.getEngagementMetrics(userId),
            analytics.getActivityHeatmap(userId, new Date().getFullYear()),
        ]);

        return NextResponse.json({
            timeOnPlatform,
            creationStats,
            engagementMetrics,
            heatmap,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
