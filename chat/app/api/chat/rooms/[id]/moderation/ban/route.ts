import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const banSchema = z.object({
    user_id: z.string().uuid(),
    reason: z.string().optional(),
    expires_at: z.string().datetime().optional(), // ISO string
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
        const body = banSchema.parse(json);

        // Check permissions
        // 1. Is Owner?
        const { data: room } = await supabase
            .from('chat_rooms')
            .select('owner_id')
            .eq('id', roomId)
            .single();

        let isMod = false;
        if (room && room.owner_id === user.id) {
            isMod = true;
        } else {
            // 2. Is Mod?
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

        // Perform Ban
        const { error: banError } = await supabase
            .from('room_bans')
            .insert({
                room_id: roomId,
                user_id: body.user_id,
                reason: body.reason,
                banned_by: user.id,
                expires_at: body.expires_at || null,
            });

        if (banError) {
            // unique constraint violation means already banned
            if (banError.code === '23505') {
                return NextResponse.json({ error: 'User already banned' }, { status: 409 });
            }
            return NextResponse.json({ error: banError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: e.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
