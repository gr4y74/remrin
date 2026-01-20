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

        // Use the RPC function if available, or just count manually
        // Since I'm not sure if RPC is exposed/working perfectly, I'll count manually or use a single query if possible.

        const [followersCount, followingCount] = await Promise.all([
            supabase
                .from('user_follows')
                .select('id', { count: 'exact', head: true })
                .eq('following_id', userId),
            supabase
                .from('user_follows')
                .select('id', { count: 'exact', head: true })
                .eq('follower_id', userId)
        ]);

        return NextResponse.json({
            followers: followersCount.count || 0,
            following: followingCount.count || 0,
        });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/stats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
