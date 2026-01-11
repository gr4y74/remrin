import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const viewSchema = z.object({
    profile_user_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        // Viewers don't strictly need to be logged in for public profiles, 
        // but if they are, we track them. If not, viewer_user_id is null.

        const body = await request.json();
        const { profile_user_id } = viewSchema.parse(body);

        // Don't track own views (optional logic)
        if (user?.id === profile_user_id) {
            return NextResponse.json({ message: 'Own view not tracked' });
        }

        // Use RPC or upsert with increment logic
        // Since Supabase doesn't have a direct "increment on conflict", 
        // we can use an RPC or just try a simple insert and handle the failure, 
        // or a select then insert/update.

        const today = new Date().toISOString().split('T')[0];

        const { error } = await supabase.rpc('increment_profile_view', {
            p_profile_user_id: profile_user_id,
            p_viewer_user_id: user?.id || null,
            p_view_date: today
        });

        if (error) {
            // Fallback if RPC doesn't exist (though Agent Alpha should have added it)
            // Actually, I'll just use a manual upsert if RPC fails or as primary.
            // But wait, postgres has "ON CONFLICT ... UPDATE SET view_count = view_count + 1"
            // Supabase JS client doesn't support that directly yet in upsert().

            // I'll try the RPC first, it's safer for race conditions.
            console.warn('RPC increment_profile_view failed or missing, trying manual upsert');

            // Manual upsert logic (not atomic, but works for basic tracking)
            const { data: existing } = await supabase
                .from('profile_views')
                .select('id, view_count')
                .eq('profile_user_id', profile_user_id)
                .eq('viewer_user_id', user?.id || null)
                .eq('view_date', today)
                .single();

            if (existing) {
                await supabase
                    .from('profile_views')
                    .update({ view_count: existing.view_count + 1 })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('profile_views')
                    .insert({
                        profile_user_id,
                        viewer_user_id: user?.id || null,
                        view_date: today,
                        view_count: 1
                    });
            }
        }

        return NextResponse.json({ message: 'View tracked successfully' });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error tracking profile view:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
