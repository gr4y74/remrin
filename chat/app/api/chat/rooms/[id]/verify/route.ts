import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const verifySchema = z.object({
    password: z.string(),
});

import { cookies } from 'next/headers';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { id } = params;

    try {
        const json = await req.json();
        const body = verifySchema.parse(json);

        const { data: room, error } = await supabase
            .from('chat_rooms')
            .select('password_hash')
            .eq('id', id)
            .single();

        if (error || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Compare password (plain text as per earlier decision for MVP/Turbo, or hash comparison if we hashed)
        // We decided to store it in `password_hash` column.
        if (room.password_hash !== body.password) {
            return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
