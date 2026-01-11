import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const postSchema = z.object({
    content: z.string().min(1).max(10000),
    media_urls: z.array(z.string().url()).max(10).optional().default([]),
    post_type: z.enum(['text', 'image', 'character_showcase', 'achievement_share']).default('text'),
    visibility: z.enum(['public', 'followers', 'private']).default('public'),
    persona_id: z.string().uuid().optional(),
    achievement_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = postSchema.parse(body);

        const { data: post, error } = await supabase
            .from('posts')
            .insert({
                user_id: user.id,
                ...validatedData,
            })
            .select(`
                *,
                author:user_profiles!posts_user_id_fkey(username, display_name, hero_image_url, banner_url)
            `)
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ post }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/posts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get('cursor');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const profileId = searchParams.get('profileId');

        let query = supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        if (profileId) {
            query = query.eq('user_id', profileId);
        }

        const { data: posts, error } = await query;

        if (error) {
            console.error('Error fetching posts:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Manually fetch author data for each post
        const postsWithAuthors = await Promise.all(
            (posts || []).map(async (post) => {
                const { data: author } = await supabase
                    .from('user_profiles')
                    .select('username, display_name, hero_image_url, banner_url')
                    .eq('user_id', post.user_id)
                    .single();

                // Fetch reaction, comment, and share counts
                const { count: reactionCount } = await supabase
                    .from('post_reactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                const { count: commentCount } = await supabase
                    .from('post_comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                const { count: shareCount } = await supabase
                    .from('post_shares')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                return {
                    ...post,
                    author: author || null,
                    reactions: [{ count: reactionCount || 0 }],
                    comments: [{ count: commentCount || 0 }],
                    shares: [{ count: shareCount || 0 }]
                };
            })
        );

        return NextResponse.json({
            posts: postsWithAuthors,
            nextCursor: posts && posts.length === limit ? posts[posts.length - 1].created_at : null
        });
    } catch (error) {
        console.error('Error in GET /api/posts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
