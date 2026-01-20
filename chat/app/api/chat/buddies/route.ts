import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/buddies - Get buddy list with online status
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use the helper function we created
        const { data: buddies, error } = await supabase
            .rpc('get_buddies_with_status', { p_user_id: user.id });

        if (error) {
            console.error('Error fetching buddies:', error);
            return NextResponse.json({ error: 'Failed to fetch buddies' }, { status: 500 });
        }

        return NextResponse.json({ buddies: buddies || [] });
    } catch (error) {
        console.error('Buddies API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/chat/buddies - Add a buddy
export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { buddyUsername, groupName = 'Buddies', nickname } = body;

        if (!buddyUsername) {
            return NextResponse.json({ error: 'buddyUsername is required' }, { status: 400 });
        }

        // Find the buddy user by username
        const { data: buddyProfile, error: profileError } = await supabase
            .from('user_profiles_chat')
            .select('user_id, username')
            .eq('username', buddyUsername)
            .single();

        if (profileError || !buddyProfile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if already buddies
        const { data: existing } = await supabase
            .from('buddy_lists')
            .select('buddy_id')
            .eq('user_id', user.id)
            .eq('buddy_id', buddyProfile.user_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Already in buddy list' }, { status: 409 });
        }

        // Check if blocked
        const { data: isBlocked } = await supabase
            .rpc('is_blocked', { checker_id: buddyProfile.user_id, target_id: user.id });

        if (isBlocked) {
            return NextResponse.json({ error: 'Unable to add this user' }, { status: 403 });
        }

        // Add buddy
        const { data: newBuddy, error: insertError } = await supabase
            .from('buddy_lists')
            .insert({
                user_id: user.id,
                buddy_id: buddyProfile.user_id,
                buddy_username: buddyProfile.username,
                group_name: groupName,
                nickname: nickname || null,
                status: 'accepted'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error adding buddy:', insertError);
            return NextResponse.json({ error: 'Failed to add buddy' }, { status: 500 });
        }

        return NextResponse.json({ buddy: newBuddy }, { status: 201 });
    } catch (error) {
        console.error('Add buddy API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
