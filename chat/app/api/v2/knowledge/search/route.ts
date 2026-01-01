import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * Knowledge Search API
 * POST: { query: string, limit?: number }
 */
export async function POST(req: Request) {
    try {
        const { query, limit = 20, personaId } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Search in file_name and content
        // We use ILIKE for case-insensitive matching
        let dbQuery = supabase
            .from('user_knowledge')
            .select('id, file_name, file_type, content, created_at, shared_with_all, persona_ids')
            .eq('user_id', user.id)
            .or(`file_name.ilike.%${query}%,content.ilike.%${query}%`);

        // Apply sharing filters if personaId is provided
        if (personaId) {
            dbQuery = dbQuery.or(`shared_with_all.eq.true,persona_ids.cs.{${personaId}}`);
        }

        const { data, error } = await dbQuery
            .limit(limit)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Database search error:', error);
            return NextResponse.json({ error: 'Failed to search knowledge' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
