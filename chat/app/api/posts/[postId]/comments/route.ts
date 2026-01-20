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

        // Check if parent comment exists and doesn't exceed 2 levels of nesting
        if (validatedData.parent_comment_id) {
            const { data: parentComment } = await supabase
                .from('post_comments')
                .select('parent_comment_id')
                .eq('id', validatedData.parent_comment_id)
                .single();

            if (!parentComment) {
                return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
            }

            // If parent has a parent, check if that grandparent also has a parent
            if (parentComment.parent_comment_id) {
                const { data: grandparentComment } = await supabase
                    .from('post_comments')
                    .select('parent_comment_id')
                    .eq('id', parentComment.parent_comment_id)
                    .single();

                if (grandparentComment?.parent_comment_id) {
                    return NextResponse.json({ error: 'Nesting limit reached (max 2 levels)' }, { status: 400 });
                }
            }
        }

        // Insert comment without JOIN to avoid relationship error
        const { data: comment, error } = await supabase
            .from('post_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                ...validatedData,
            })
            .select('*')
            .single();

        if (error) {
            console.error('Error adding comment:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Fetch author separately to avoid relationship issues
        const { data: author } = await supabase
            .from('user_profiles')
            .select('username, display_name, hero_image_url')
            .eq('user_id', user.id)
            .single();

        const commentWithAuthor = {
            ...comment,
            author: author ? {
                ...author,
                avatar_url: author.hero_image_url
            } : null
        };

        // Create notification for post author
        const { data: postAuthor } = await supabase
            .from('posts')
            .select('user_id, content')
            .eq('id', postId)
            .single();

        if (postAuthor && postAuthor.user_id !== user.id) {
            await supabase.from('notifications').insert({
                user_id: postAuthor.user_id,
                actor_id: user.id,
                notification_type: validatedData.parent_comment_id ? 'post_comment_reply' : 'comment',
                entity_type: 'post',
                entity_id: postId,
                title: validatedData.parent_comment_id ? 'Someone replied to your comment' : 'Someone commented on your post',
                message: validatedData.content.substring(0, 100),
                action_url: `/feed?tab=posts&postId=${postId}`
            });
        }

        // Create notifications for mentions
        if (validatedData.mentioned_users && validatedData.mentioned_users.length > 0) {
            const mentionNotifications = validatedData.mentioned_users
                .filter(userId => userId !== user.id) // Don't notify self
                .map(userId => ({
                    user_id: userId,
                    actor_id: user.id,
                    notification_type: 'mention' as const,
                    entity_type: 'comment',
                    entity_id: comment.id,
                    title: 'Someone mentioned you in a comment',
                    message: validatedData.content.substring(0, 100),
                    action_url: `/feed?tab=posts&postId=${postId}`
                }));

            if (mentionNotifications.length > 0) {
                await supabase.from('notifications').insert(mentionNotifications);
            }
        }

        return NextResponse.json({ comment: commentWithAuthor });
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

        const { data: { user } } = await supabase.auth.getUser();

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const offset = parseInt(searchParams.get('offset') || '0');

        // Try with JOIN first, fallback if relationship doesn't exist
        let { data: comments, error } = await supabase
            .from('post_comments')
            .select(`
                *,
                author:user_profiles(username, display_name, hero_image_url),
                likes:post_comment_likes(count)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
            .range(offset, offset + limit - 1);

        // Fallback: fetch without JOIN if relationship error
        if (error && error.message.includes('user_profiles')) {
            const { data: basicComments, error: fallbackError } = await supabase
                .from('post_comments')
                .select('*')
                .eq('post_id', postId)
                .order('created_at', { ascending: true })
                .range(offset, offset + limit - 1);

            if (fallbackError) {
                console.error('Error fetching comments:', fallbackError);
                return NextResponse.json({ error: fallbackError.message }, { status: 400 });
            }

            // Manually fetch authors and likes
            comments = await Promise.all((basicComments || []).map(async (comment) => {
                const { data: author } = await supabase
                    .from('user_profiles')
                    .select('username, display_name, hero_image_url')
                    .eq('user_id', comment.user_id)
                    .single();

                const { count: likesCount } = await supabase
                    .from('post_comment_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('comment_id', comment.id);

                return {
                    ...comment,
                    author,
                    likes: [{ count: likesCount || 0 }]
                };
            }));
        } else if (error) {
            console.error('Error fetching comments:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Fetch user's likes for these comments
        let userLikedComments: Set<string> = new Set();
        if (user && comments && comments.length > 0) {
            const { data: likes } = await supabase
                .from('post_comment_likes')
                .select('comment_id')
                .eq('user_id', user.id)
                .in('comment_id', comments.map(c => c.id));

            if (likes) {
                userLikedComments = new Set(likes.map(l => l.comment_id));
            }
        }

        const formattedComments = comments?.map(c => ({
            ...c,
            author: c.author ? {
                ...c.author,
                avatar_url: c.author.hero_image_url
            } : null,
            likes_count: c.likes?.[0]?.count || 0,
            user_liked: userLikedComments.has(c.id),
            likes: undefined // remove the count object
        }));

        return NextResponse.json({ comments: formattedComments || [] });
    } catch (error) {
        console.error('Error in GET /api/posts/[postId]/comments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
