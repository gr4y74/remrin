import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { userId } = params;

        const { data: highlights, error } = await supabase
            .from('showcase_items')
            .select('*')
            .eq('user_id', userId)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Error fetching highlights:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ highlights: highlights || [] });
    } catch (error) {
        console.error('Error in GET /api/profile/[userId]/highlights:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
