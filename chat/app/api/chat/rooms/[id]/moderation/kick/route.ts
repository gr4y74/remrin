import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const kickSchema = z.object({
    user_id: z.string().uuid(),
    reason: z.string().optional(),
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
        const body = kickSchema.parse(json);

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

        // TODO: Send kick signal via Realtime channel when server-side broadcast is available
        // For now, we'll just return success. The frontend mod tool could handle the "kick" logic 
        // by unsubscribing the user if possible (not possible from another client easily)
        // or by updating a 'kick_events' table the client listens to.

        return NextResponse.json({ success: true, message: "Kick signal sent (mock)" });
    } catch (e) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
