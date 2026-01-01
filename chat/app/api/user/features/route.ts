import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkFeature } from '@/lib/server/feature-gates';
import { cookies } from 'next/headers';

// GET /api/user/features?feature=feature_key
export async function GET(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const featureKey = searchParams.get('feature');

        if (!featureKey) {
            return NextResponse.json({ error: 'Missing feature parameter' }, { status: 400 });
        }

        const gate = await checkFeature(user.id, featureKey);

        return NextResponse.json(gate);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
