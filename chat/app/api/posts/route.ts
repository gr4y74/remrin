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
            .select('*')
            .single();

        if (error) {
            console.error('Error creating post:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Manually fetch author data
        const { data: author } = await supabase
            .from('user_profiles')
            .select('username, display_name, hero_image_url, banner_url')
            .eq('user_id', user.id)
            .single();

        const postWithAuthor = {
            ...post,
            author: author || null
        };

        return NextResponse.json({ post: postWithAuthor }, { status: 201 });
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
        const filter = searchParams.get('filter') as 'following' | 'trending' | null;

        // Get current user for 'following' filter and user_reaction check
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Basic query setup
        // We start with a simpler query and will add data based on what's available
        let query = supabase
            .from('posts')
            .select(`
                *,
                author:user_profiles(username, display_name, hero_image_url, banner_url)
            `);

        // 2. Apply Filters
        if (filter === 'following') {
            if (!user) {
                return NextResponse.json({
                    posts: [],
                    nextCursor: null,
                    message: 'Login to see posts from people you follow'
                });
            }

            const { data: following } = await supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', user.id);

            const followingIds = following?.map(f => f.following_id) || [];

            if (followingIds.length === 0) {
                return NextResponse.json({
                    posts: [],
                    nextCursor: null,
                    message: 'Follow people to see their posts here'
                });
            }

            query = query.in('user_id', followingIds);
        } else if (filter === 'trending') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            query = query.gte('created_at', sevenDaysAgo.toISOString());
        }

        if (profileId) {
            query = query.eq('user_id', profileId);
        }

        if (cursor) {
            query = query.lt('created_at', cursor);
        }

        const { data: results, error: queryError } = await query
            .order('created_at', { ascending: false })
            .limit(limit);

        if (queryError) {
            console.error('Error fetching posts:', queryError);
            // If the join with author failed, try fetching just posts
            if (queryError.message.includes('user_profiles')) {
                const fallbackResult = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (fallbackResult.error) {
                    return NextResponse.json({ error: fallbackResult.error.message }, { status: 400 });
                }
                // We'll proceed with fallback posts and fetch authors manually below
                return await formatResults(fallbackResult.data || [], supabase, user, limit);
            }
            return NextResponse.json({ error: queryError.message }, { status: 400 });
        }

        return await formatResults(results || [], supabase, user, limit);

    } catch (error) {
        console.error('Error in GET /api/posts:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper to format and augment results
async function formatResults(results: any[], supabase: any, user: any, limit: number) {
    const postsWithDetails = await Promise.all(
        results.map(async (post: any) => {
            // Fetch author manually if join failed or we used fallback
            let author = post.author;
            if (!author) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('username, display_name, hero_image_url, banner_url')
                    .eq('user_id', post.user_id)
                    .single();
                author = profile;
            }

            // Fetch engagement counts (safe approach)
            const { count: reactions_count } = await supabase
                .from('post_reactions')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            const { count: comments_count } = await supabase
                .from('post_comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            const { count: shares_count } = await supabase
                .from('post_shares')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            let user_reaction = null;
            if (user) {
                const { data: reaction } = await supabase
                    .from('post_reactions')
                    .select('reaction_type')
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)
                    .single();
                user_reaction = reaction?.reaction_type || null;
            }

            return {
                ...post,
                author: author ? {
                    ...author,
                    avatar_url: author.hero_image_url
                } : null,
                reactions_count: reactions_count || 0,
                comments_count: comments_count || 0,
                shares_count: shares_count || 0,
                user_reaction,
                // Legacy formats for frontend
                reactions: [{ count: reactions_count || 0 }],
                comments: [{ count: comments_count || 0 }],
                shares: [{ count: shares_count || 0 }]
            };
        })
    );

    return NextResponse.json({
        posts: postsWithDetails,
        nextCursor: results.length === limit ? results[results.length - 1].created_at : null
    });
}

