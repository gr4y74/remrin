import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: { id: string };
}

// DELETE /api/chat/block/[id] - Unblock a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const blockedId = params.id;

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('blocked_users')
            .delete()
            .eq('blocker_id', user.id)
            .eq('blocked_id', blockedId);

        if (error) {
            console.error('Error unblocking user:', error);
            return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unblock user API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
