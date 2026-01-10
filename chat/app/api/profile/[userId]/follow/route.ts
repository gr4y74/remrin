import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = params;

        // Prevent self-follow
        if (user.id === userId) {
            return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
        }

        // Check if already following
        const { data: existing } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Already following' }, { status: 400 });
        }

        // Create follow relationship
        const { data: follow, error } = await supabase
            .from('user_follows')
            .insert({
                follower_id: user.id,
                following_id: userId,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating follow:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ follow }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/profile/[userId]/follow:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId } = params;

        // Delete follow relationship
        const { error } = await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', userId);

        if (error) {
            console.error('Error deleting follow:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/profile/[userId]/follow:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Get follow status
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ isFollowing: false });
        }

        const { userId } = params;

        const { data: follow } = await supabase
            .from('user_follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();

        return NextResponse.json({ isFollowing: !!follow });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/follow:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
