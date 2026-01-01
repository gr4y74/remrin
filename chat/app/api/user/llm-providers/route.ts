import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import {
    getAvailableLLMProviders,
    getUserLLMProvider,
    setUserLLMProvider,
    getUserTier
} from '@/lib/server/feature-gates';

// GET /api/user/llm-providers - Get available providers for user
export async function GET(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [providers, currentProvider, tierInfo] = await Promise.all([
            getAvailableLLMProviders(user.id),
            getUserLLMProvider(user.id),
            getUserTier(user.id)
        ]);

        return NextResponse.json({
            providers,
            current_provider: currentProvider.provider?.provider_key || 'deepseek',
            current_settings: currentProvider.settings,
            tier: tierInfo.tier,
            tier_name: tierInfo.tierName
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/user/llm-providers - Update user's LLM provider preference
export async function POST(req: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { provider, settings } = await req.json();

        await setUserLLMProvider(user.id, provider, settings);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
