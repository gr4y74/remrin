import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAllLLMProviders, invalidateFeatureCache } from '@/lib/server/feature-gates';

// GET /api/admin/llm-providers - List all LLM providers
export async function GET(req: NextRequest) {
    const supabase = createClient(cookies());

    // Check admin permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const providers = await getAllLLMProviders();
        return NextResponse.json({ providers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/admin/llm-providers - Create/update LLM provider
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
            .from('llm_providers')
            .upsert(body, { onConflict: 'provider_key' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ provider: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
