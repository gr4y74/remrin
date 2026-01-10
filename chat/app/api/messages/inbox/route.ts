import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get messages where user is recipient
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                *,
                sender:profiles!messages_sender_id_fkey(
                    id,
                    username,
                    display_name,
                    image_url
                )
            `)
            .eq('recipient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching inbox:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ messages: messages || [] });
    } catch (error) {
        console.error('Error in GET /api/messages/inbox:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
