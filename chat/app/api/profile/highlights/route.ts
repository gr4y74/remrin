import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const pinSchema = z.object({
    item_type: z.enum(['post', 'achievement', 'persona', 'custom']),
    item_id: z.string().uuid(),
    title: z.string().max(200).optional(),
    description: z.string().optional(),
    thumbnail_url: z.string().url().optional(),
    display_order: z.number().int().min(0).optional().default(0),
    metadata: z.record(z.any()).optional().default({}),
});

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = pinSchema.parse(body);

        const { data: highlight, error } = await supabase
            .from('showcase_items')
            .upsert({
                user_id: user.id,
                ...validatedData,
            }, { onConflict: 'user_id, item_type, item_id' })
            .select()
            .single();

        if (error) {
            console.error('Error pinning highlight:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // If it's a post, also mark it as pinned in the posts table (optional)
        if (validatedData.item_type === 'post') {
            await supabase
                .from('posts')
                .update({ is_pinned: true })
                .eq('id', validatedData.item_id)
                .eq('user_id', user.id);
        }

        return NextResponse.json({ highlight });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/profile/highlights:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
