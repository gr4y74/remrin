import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { commentId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { commentId } = params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if already liked
        const { data: existingLike } = await supabase
            .from('post_comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', user.id)
            .single();

        if (existingLike) {
            // Unlike
            const { error: deleteError } = await supabase
                .from('post_comment_likes')
                .delete()
                .eq('id', existingLike.id);

            if (deleteError) {
                return NextResponse.json({ error: deleteError.message }, { status: 400 });
            }

            return NextResponse.json({ liked: false });
        } else {
            // Like
            const { error: insertError } = await supabase
                .from('post_comment_likes')
                .insert({
                    comment_id: commentId,
                    user_id: user.id
                });

            if (insertError) {
                return NextResponse.json({ error: insertError.message }, { status: 400 });
            }

            // Create notification for comment author
            const { data: commentData } = await supabase
                .from('post_comments')
                .select('user_id, content, post_id')
                .eq('id', commentId)
                .single();

            if (commentData && commentData.user_id !== user.id) {
                await supabase.from('notifications').insert({
                    user_id: commentData.user_id,
                    actor_id: user.id,
                    notification_type: 'post_reaction', // Using post_reaction as a generic reaction type or we could use a specific one if added
                    entity_type: 'comment',
                    entity_id: commentId,
                    title: 'Someone liked your comment',
                    message: commentData.content.substring(0, 100),
                    action_url: `/feed?tab=posts&postId=${commentData.post_id}`
                });
            }

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error('Error in POST /api/comments/[commentId]/like:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
