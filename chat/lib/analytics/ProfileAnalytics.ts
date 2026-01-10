import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Database } from '@/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

export class ProfileAnalytics {
    private getClient(): SupabaseClient<Database> {
        const cookieStore = cookies();
        return createClient(cookieStore) as unknown as SupabaseClient<Database>;
    }

    async trackActivity(
        userId: string,
        activityType: string,
        metadata: Record<string, any> = {}
    ): Promise<void> {
        const supabase = this.getClient();
        const today = new Date().toISOString().split('T')[0];

        await supabase
            .from('profile_analytics')
            .upsert({
                user_id: userId,
                metric_type: activityType,
                value: 1,
                metadata,
                date: today,
                aggregation_period: 'daily',
            }, {
                onConflict: 'user_id,metric_type,date,aggregation_period',
                ignoreDuplicates: false,
            });
    }

    async getTimeOnPlatform(userId: string, period: 'day' | 'week' | 'month' | 'all'): Promise<number> {
        const supabase = this.getClient();
        const startDate = this.getStartDate(period);

        const { data } = await supabase
            .from('profile_analytics')
            .select('value')
            .eq('user_id', userId)
            .eq('metric_type', 'time_spent')
            .gte('date', startDate);

        return data?.reduce((sum, row) => sum + row.value, 0) || 0;
    }

    async getActivityHeatmap(userId: string, year: number): Promise<Record<string, number>> {
        const supabase = this.getClient();
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { data } = await supabase
            .from('profile_analytics')
            .select('date, value')
            .eq('user_id', userId)
            .eq('metric_type', 'daily_activity')
            .gte('date', startDate)
            .lte('date', endDate);

        const heatmap: Record<string, number> = {};
        data?.forEach(row => {
            heatmap[row.date] = row.value;
        });

        return heatmap;
    }

    async getCreationStats(userId: string): Promise<{
        total: number;
        byCategory: Record<string, number>;
        timeline: Array<{ date: string; count: number }>;
    }> {
        const supabase = this.getClient();

        const { count: total } = await supabase
            .from('personas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { data: personas } = await supabase
            .from('personas')
            .select('category, created_at')
            .eq('user_id', userId);

        const byCategory: Record<string, number> = {};
        const timeline: Record<string, number> = {};

        personas?.forEach(persona => {
            const category = persona.category || 'uncategorized';
            byCategory[category] = (byCategory[category] || 0) + 1;

            if (persona.created_at) {
                const date = persona.created_at.split('T')[0];
                timeline[date] = (timeline[date] || 0) + 1;
            }
        });

        return {
            total: total || 0,
            byCategory,
            timeline: Object.entries(timeline).map(([date, count]) => ({ date, count })),
        };
    }

    async getEngagementMetrics(userId: string): Promise<{
        messages: number;
        favorites: number;
        views: number;
    }> {
        const supabase = this.getClient();

        const { count: messages } = await supabase
            .from('messages') // Assuming 'messages' table exists in types
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        const { count: favorites } = await supabase
            .from('favorites' as any) // Assuming 'favorites' table exists in types
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // profile_analytics table query
        const { data: viewsData } = await supabase
            .from('profile_analytics')
            .select('value')
            .eq('user_id', userId)
            .eq('metric_type', 'profile_views')
            .single();

        return {
            messages: messages || 0,
            favorites: favorites || 0,
            views: viewsData?.value || 0,
        };
    }

    private getStartDate(period: string): string {
        const now = new Date();
        switch (period) {
            case 'day':
                return now.toISOString().split('T')[0];
            case 'week':
                now.setDate(now.getDate() - 7);
                return now.toISOString().split('T')[0];
            case 'month':
                now.setMonth(now.getMonth() - 1);
                return now.toISOString().split('T')[0];
            default:
                return '1970-01-01';
        }
    }
}
