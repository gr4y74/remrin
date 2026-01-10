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

        // Get followers list
        const { data: followers, error } = await supabase
            .from('user_follows')
            .select(`
                follower_id,
                created_at,
                follower:profiles!user_follows_follower_id_fkey(
                    id,
                    username,
                    display_name,
                    image_url
                )
            `)
            .eq('following_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching followers:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ followers: followers || [] });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/followers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
