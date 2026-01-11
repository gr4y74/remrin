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

        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        // Fetch user's posts
        // RLS handles visibility (e.g. followers-only posts won't be returned if requester isn't a follower)
        let query = supabase
            .from('posts')
            .select(`
                *,
                author:user_profiles!posts_user_id_fkey(username, display_name, avatar_url, hero_image_url),
                reactions:post_reactions(count),
                comments:post_comments(count),
                shares:post_shares(count)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('Error fetching user posts:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            posts: posts || [],
            nextCursor: posts && posts.length === limit ? posts[posts.length - 1].created_at : null
        });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/posts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
