import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] });
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: users, error } = await supabase
            .from('user_profiles')
            .select('id, username, display_name, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(5);

        if (error) {
            console.error('Error searching users:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ users: users || [] });
    } catch (error) {
        console.error('Error in GET /api/username/search:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
