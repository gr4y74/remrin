import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// GET /api/admin/tiers/sync - Sync all user tiers with Stripe
export async function GET(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Call the sync function
        const { data, error } = await supabase.rpc('sync_all_user_tiers');

        if (error) throw error;

        const updated = data?.filter((r: any) => r.old_tier !== r.new_tier) || [];
        const unchanged = data?.filter((r: any) => r.old_tier === r.new_tier) || [];

        return NextResponse.json({
            success: true,
            total_users: data?.length || 0,
            updated_count: updated.length,
            unchanged_count: unchanged.length,
            updates: updated
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/tiers/sync - Manually update a user's tier
export async function POST(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { user_id, tier, reason } = await req.json();

        if (!user_id || !tier) {
            return NextResponse.json({
                error: 'Missing required fields: user_id, tier'
            }, { status: 400 });
        }

        // Call the update function
        const { error } = await supabase.rpc('update_user_tier', {
            p_user_id: user_id,
            p_new_tier: tier,
            p_reason: reason || 'admin_manual',
            p_subscription_id: null,
            p_changed_by: user.id
        });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
