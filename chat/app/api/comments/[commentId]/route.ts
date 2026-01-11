import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
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

        const { data, error } = await supabase
            .from('post_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id) // Only owner can delete
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: 'Comment not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /api/comments/[commentId]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
