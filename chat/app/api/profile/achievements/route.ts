import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        // Fetch all achievements
        const { data: allAchievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true });
        if (achievementsError) {
            throw achievementsError;
        }
        // Fetch user's earned achievements
        const { data: userAchievements, error: userError } = await supabase
            .from('user_achievements')
            .select('achievement_id, earned_date')
            .eq('user_id', userId);
        if (userError) {
            throw userError;
        }
        const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
        // Combine data
        const achievements = allAchievements?.map(achievement => ({
            ...achievement,
            earned: earnedIds.has(achievement.id),
            earned_date: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.earned_date,
        }));
        return NextResponse.json({ achievements });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
