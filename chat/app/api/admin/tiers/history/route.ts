import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET /api/admin/tiers/history - Get tier change history
export async function GET(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('user_id');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('tier_change_history')
            .select(`
        *,
        user:user_id(email),
        changed_by_user:changed_by(email)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ history: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
