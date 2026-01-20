import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/block - Get blocked users list
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: blocked, error } = await supabase
            .from('blocked_users')
            .select(`
        id,
        blocked_id,
        reason,
        created_at
      `)
            .eq('blocker_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching blocked users:', error);
            return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 });
        }

        return NextResponse.json({ blocked: blocked || [] });
    } catch (error) {
        console.error('Block list API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/chat/block - Block a user
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { userId, reason } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        if (userId === user.id) {
            return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
        }

        // Check if already blocked
        const { data: existing } = await supabase
            .from('blocked_users')
            .select('id')
            .eq('blocker_id', user.id)
            .eq('blocked_id', userId)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'User already blocked' }, { status: 409 });
        }

        // Block the user
        const { data: block, error: insertError } = await supabase
            .from('blocked_users')
            .insert({
                blocker_id: user.id,
                blocked_id: userId,
                reason: reason || null
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error blocking user:', insertError);
            return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
        }

        // Also remove from buddy list if they were a buddy
        await supabase
            .from('buddy_lists')
            .delete()
            .eq('user_id', user.id)
            .eq('buddy_id', userId);

        return NextResponse.json({ block }, { status: 201 });
    } catch (error) {
        console.error('Block user API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
