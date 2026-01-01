import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAllFeatures, invalidateFeatureCache } from '@/lib/server/feature-gates';

// GET /api/admin/features - List all features
export async function GET(req: NextRequest) {
    const supabase = createClient(cookies());

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const features = await getAllFeatures();
        return NextResponse.json({ features });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/features - Create/update feature
export async function POST(req: NextRequest) {
    const supabase = createClient(cookies());

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        const { data, error } = await supabase
            .from('tier_features')
            .upsert(body, { onConflict: 'feature_key' })
            .select()
            .single();

        if (error) throw error;

        // Invalidate cache
        invalidateFeatureCache();

        return NextResponse.json({ feature: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/admin/features/[id] - Delete feature
export async function DELETE(req: NextRequest) {
    const supabase = createClient(cookies());

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const url = new URL(req.url);
        const id = url.pathname.split('/').pop();

        const { error } = await supabase
            .from('tier_features')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidate cache
        invalidateFeatureCache();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
