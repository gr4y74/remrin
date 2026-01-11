import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { id } = params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: notification, error } = await supabase
            .from('notifications')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', user.id) // Only mark own notifications
            .select()
            .single();

        if (error) {
            console.error('Error marking notification as read:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Error in PUT /api/notifications/[id]/read:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
