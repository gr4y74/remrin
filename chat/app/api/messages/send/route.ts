import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sendMessageSchema = z.object({
    recipient_id: z.string().uuid(),
    content: z.string().min(1).max(1000),
});

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = sendMessageSchema.parse(body);

        // Prevent self-messaging
        if (user.id === validatedData.recipient_id) {
            return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert({
                sender_id: user.id,
                ...validatedData,
            })
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/messages/send:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
