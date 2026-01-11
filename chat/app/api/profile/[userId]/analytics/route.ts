import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { userId } = params;

        // Fetch views summary
        const { data: views } = await supabase
            .from('profile_views')
            .select('*')
            .eq('profile_user_id', userId)
            .order('view_date', { ascending: false })
            .limit(30);

        // Fetch follower growth
        const { data: growth } = await supabase
            .from('follower_growth')
            .select('*')
            .eq('user_id', userId)
            .order('growth_date', { ascending: false })
            .limit(30);

        // Fetch activity heatmap
        const { data: heatmap } = await supabase
            .from('activity_heatmap')
            .select('*')
            .eq('user_id', userId)
            .order('activity_date', { ascending: false })
            .limit(100);

        return NextResponse.json({
            analytics: {
                views: views || [],
                growth: growth || [],
                heatmap: heatmap || []
            }
        });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
