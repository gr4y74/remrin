import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Aggregate dashboard data
        // 1. Total views
        const { data: totalViews } = await supabase
            .from('profile_views')
            .select('view_count')
            .eq('profile_user_id', user.id);

        const sumViews = totalViews?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

        // 2. Recent posts performance
        const { data: recentPosts } = await supabase
            .from('posts')
            .select(`
                id,
                content,
                created_at,
                view_count,
                reactions:post_reactions(count),
                comments:post_comments(count)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        // 3. User stats (followers/following) - use helper function from schema if possible
        const { data: followStats } = await supabase.rpc('get_follower_counts', {
            user_uuid: user.id
        });

        return NextResponse.json({
            dashboard: {
                total_views: sumViews,
                recent_posts: recentPosts || [],
                followers: followStats?.[0]?.followers || 0,
                following: followStats?.[0]?.following || 0
            }
        });
    } catch (error) {
        console.error('Error in GET /api/analytics/dashboard:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
