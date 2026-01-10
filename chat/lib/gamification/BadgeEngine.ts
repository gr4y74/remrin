import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export class BadgeEngine {
    async checkAchievements(userId: string): Promise<string[]> {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const newBadges: string[] = [];

        // Get all active achievements
        const { data: achievements } = await supabase
            .from('achievements')
            .select('*')
            .eq('is_active', true);

        // Get user's earned achievements
        const { data: earned } = await supabase
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId);

        const earnedIds = new Set(earned?.map(e => e.achievement_id) || []);

        // Check each achievement
        for (const achievement of achievements || []) {
            if (earnedIds.has(achievement.id)) continue;

            const criteria = achievement.criteria_json;
            const meetsRequirements = await this.checkCriteria(userId, criteria);

            if (meetsRequirements) {
                await this.awardBadge(userId, achievement.id);
                newBadges.push(achievement.badge_id);
            }
        }

        return newBadges;
    }

    async awardBadge(userId: string, achievementId: string): Promise<void> {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        await supabase.from('user_achievements').insert({
            user_id: userId,
            achievement_id: achievementId,
            earned_date: new Date().toISOString(),
            is_displayed: true,
        });
    }

    async checkCriteria(userId: string, criteria: any): Promise<boolean> {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        switch (criteria.type) {
            case 'creation_count':
                const { count } = await supabase
                    .from('personas')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                return (count || 0) >= criteria.count;

            case 'account_age':
                const { data: user } = await supabase
                    .from('user_profiles')
                    .select('created_at')
                    .eq('user_id', userId)
                    .single();

                if (!user) return false;

                const daysSince = Math.floor(
                    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                return daysSince >= criteria.days;

            case 'message_count':
                const { count: msgCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                return (msgCount || 0) >= criteria.count;

            default:
                return false;
        }
    }

    async calculateProgress(userId: string, achievementId: string): Promise<number> {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: achievement } = await supabase
            .from('achievements')
            .select('criteria_json')
            .eq('id', achievementId)
            .single();

        if (!achievement) return 0;

        const criteria = achievement.criteria_json;
        const current = await this.getCurrentValue(userId, criteria);
        const target = this.getTargetValue(criteria);

        return Math.min(100, Math.floor((current / target) * 100));
    }

    private async getCurrentValue(userId: string, criteria: any): Promise<number> {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        switch (criteria.type) {
            case 'creation_count':
                const { count } = await supabase
                    .from('personas')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);
                return count || 0;

            case 'account_age':
                const { data: user } = await supabase
                    .from('user_profiles')
                    .select('created_at')
                    .eq('user_id', userId)
                    .single();

                if (!user) return 0;

                return Math.floor(
                    (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );

            default:
                return 0;
        }
    }

    private getTargetValue(criteria: any): number {
        return criteria.count || criteria.days || 1;
    }
}
