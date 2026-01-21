import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const unbanSchema = z.object({
    user_id: z.string().uuid(),
});

import { cookies } from 'next/headers';

export async function POST(
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

    try {
        const json = await req.json();
        const body = unbanSchema.parse(json);

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

        const { error: unbanError } = await supabase
            .from('room_bans')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', body.user_id);

        if (unbanError) {
            return NextResponse.json({ error: unbanError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
