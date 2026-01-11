import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updatePostSchema = z.object({
    content: z.string().min(1).max(10000).optional(),
    media_urls: z.array(z.string().url()).max(10).optional(),
    visibility: z.enum(['public', 'followers', 'private']).optional(),
    is_pinned: z.boolean().optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { postId } = params;

        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:user_profiles!posts_user_id_fkey(username, display_name, avatar_url, hero_image_url),
                reactions:post_reactions(count),
                comments:post_comments(count),
                shares:post_shares(count)
            `)
            .eq('id', postId)
            .single();

        if (error || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Apply visibility check (though RLS should handle this, extra layer of safety)
        const { data: { user } } = await supabase.auth.getUser();
        if (post.visibility === 'private' && post.user_id !== user?.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (post.visibility === 'followers' && post.user_id !== user?.id) {
            // Check if user is following author
            const { data: follow } = await supabase
                .from('user_follows')
                .select('id')
                .eq('follower_id', user?.id)
                .eq('following_id', post.user_id)
                .single();

            if (!follow) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        return NextResponse.json({ post });
    } catch (error) {
        console.error('Error in GET /api/posts/[postId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { postId } = params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updatePostSchema.parse(body);

        // Update post with ownership check
        const { data: post, error } = await supabase
            .from('posts')
            .update(validatedData)
            .eq('id', postId)
            .eq('user_id', user.id) // Only owner can update
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!post) {
            return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ post });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in PUT /api/posts/[postId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { postId } = params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', user.id) // Only owner can delete
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/posts/[postId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
