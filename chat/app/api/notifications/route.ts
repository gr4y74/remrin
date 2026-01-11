import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
        const offset = parseInt(searchParams.get('offset') || '0');

        const { data: notifications, error } = await supabase
            .from('notifications')
            .select(`
                *,
                actor:user_profiles!notifications_actor_id_fkey(username, display_name, avatar_url, hero_image_url)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching notifications:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ notifications: notifications || [] });
    } catch (error) {
        console.error('Error in GET /api/notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
