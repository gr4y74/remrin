import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const supabase = createClient(cookies());

    const { data, error } = await supabase
        .from('personas')
        .select('id, name, description, image_url, intro_message')
        .eq('visibility', 'PUBLIC')
        .eq('status', 'approved')
        .ilike('name', `%${query}%`)
        .limit(20);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
