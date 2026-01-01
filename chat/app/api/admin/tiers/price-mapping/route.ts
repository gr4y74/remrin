import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from "next/headers"

// GET /api/admin/tiers/price-mapping - Get all price mappings
export async function GET(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('tier_price_mapping')
            .select('*')
            .order('tier', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ mappings: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/tiers/price-mapping - Create/update price mapping
export async function POST(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        const { data, error } = await supabase
            .from('tier_price_mapping')
            .upsert(body, { onConflict: 'stripe_price_id' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ mapping: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/tiers/price-mapping/[id] - Delete price mapping
export async function DELETE(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();

        const { error } = await supabase
            .from('tier_price_mapping')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
