import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const commentSchema = z.object({
    content: z.string().min(1).max(2000),
    parent_comment_id: z.string().uuid().optional(),
    mentioned_users: z.array(z.string().uuid()).optional().default([]),
});

export async function POST(
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
        const validatedData = commentSchema.parse(body);

        // Check if parent comment exists and doesn't have a parent (limit nesting to 1 level)
        if (validatedData.parent_comment_id) {
            const { data: parentComment } = await supabase
                .from('post_comments')
                .select('parent_comment_id')
                .eq('id', validatedData.parent_comment_id)
                .single();

            if (!parentComment) {
                return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
            }
            if (parentComment.parent_comment_id) {
                return NextResponse.json({ error: 'Nesting limit reached' }, { status: 400 });
            }
        }

        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                ...validatedData,
            })
            .select(`
                *,
                author:user_profiles!post_comments_user_id_fkey(username, display_name, avatar_url, hero_image_url)
            `)
            .single();

        if (error) {
            console.error('Error adding comment:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ comment });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/posts/[postId]/comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { postId } = params;

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: comments, error } = await supabase
            .from('post_comments')
            .select(`
                *,
                author:user_profiles!post_comments_user_id_fkey(username, display_name, avatar_url, hero_image_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching comments:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ comments: comments || [] });
    } catch (error) {
        console.error('Error in GET /api/posts/[postId]/comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
