import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

import { cookies } from 'next/headers';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { id: roomId } = params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: room } = await supabase
        .from('chat_rooms')
        .select('owner_id')
        .eq('id', roomId)
        .single();

    let isMod = false;
    if (room && room.owner_id === user.id) {
        isMod = true;
    } else {
        const { data: mod } = await supabase
            .from('room_moderators')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .single();
        if (mod) isMod = true;
    }

    if (!isMod) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Join with profiles if possible, or just return IDs.
    // Assuming profiles table exists or we just return raw.
    // Best to return user details. We'll try to fetch from auth.users or profiles if available.
    // Since we don't know exact profile schema, we'll return the ban record rows.
    // Update: We can try to join with profiles if we knew the schema.
    // Wait, I saw profile schema in other conversations but not fully detailing everything.
    // I'll stick to returning `room_bans` which includes user_id. The frontend can fetch profile names.

    const { data: bans, error: bansError } = await supabase
        .from('room_bans')
        .select('*')
        .eq('room_id', roomId);

    if (bansError) {
        return NextResponse.json({ error: bansError.message }, { status: 500 });
    }

    return NextResponse.json(bans);
}
