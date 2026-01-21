import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateRoomSchema = z.object({
    name: z.string().min(3).max(50).optional(),
    description: z.string().max(200).optional(),
    category: z.enum(['General', 'Romance', 'Sports', 'Entertainment', 'Tech', 'Gaming', 'Music', 'Art']).optional(),
    is_private: z.boolean().optional(),
    password: z.string().optional(),
    max_members: z.number().min(2).max(100).optional(),
    banner_url: z.string().url().optional().or(z.literal('')).optional(),
    rules: z.string().optional(),
});

import { cookies } from 'next/headers';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { id } = params;

    const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // If private, don't return password_hash
    if (data.is_private) {
        delete data.password_hash;
    }

    return NextResponse.json(data);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { id } = params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await req.json();
        const body = updateRoomSchema.parse(json);

        // Verify ownership
        const { data: room, error: roomError } = await supabase
            .from('chat_rooms')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (roomError || !room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        if (room.owner_id !== user.id) {
            // Also check mod permissions? Generally only owner can change room settings
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const updates: any = { ...body };
        if (updates.password) {
            updates.password_hash = updates.password;
            delete updates.password;
        }

        const { data: updated, error: updateError } = await supabase
            .from('chat_rooms')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json(updated);
    } catch (e) {
        if (e instanceof z.ZodError) {
            return NextResponse.json({ error: e.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { id } = params;
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('owner_id')
        .eq('id', id)
        .single();

    if (roomError || !room) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', id);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
