import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
    params: { id: string };
}

// PATCH /api/chat/buddies/[id] - Update buddy (nickname, group)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const buddyId = params.id;

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nickname, groupName, isFavorite } = body;

        const updates: Record<string, any> = {};
        if (nickname !== undefined) updates.nickname = nickname;
        if (groupName !== undefined) updates.group_name = groupName;
        if (isFavorite !== undefined) updates.is_favorite = isFavorite;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('buddy_lists')
            .update(updates)
            .eq('user_id', user.id)
            .eq('buddy_id', buddyId)
            .select()
            .single();

        if (error) {
            console.error('Error updating buddy:', error);
            return NextResponse.json({ error: 'Failed to update buddy' }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: 'Buddy not found' }, { status: 404 });
        }

        return NextResponse.json({ buddy: data });
    } catch (error) {
        console.error('Update buddy API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/chat/buddies/[id] - Remove buddy
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const buddyId = params.id;

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('buddy_lists')
            .delete()
            .eq('user_id', user.id)
            .eq('buddy_id', buddyId);

        if (error) {
            console.error('Error removing buddy:', error);
            return NextResponse.json({ error: 'Failed to remove buddy' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove buddy API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
