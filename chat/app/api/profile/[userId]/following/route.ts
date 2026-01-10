import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { userId } = params;

        // Get following list
        const { data: following, error } = await supabase
            .from('user_follows')
            .select(`
                following_id,
                created_at,
                following:profiles!user_follows_following_id_fkey(
                    id,
                    username,
                    display_name,
                    image_url
                )
            `)
            .eq('follower_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching following:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ following: following || [] });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/following:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
