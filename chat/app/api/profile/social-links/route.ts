import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const socialLinkSchema = z.object({
    platform: z.string().min(1).max(50),
    handle: z.string().max(100).optional(),
    url: z.string().url(),
    display_order: z.number().int().min(0).optional(),
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
        const validatedData = socialLinkSchema.parse(body);
        const { data: link, error } = await supabase
            .from('social_links')
            .insert({ ...validatedData, user_id: user.id })
            .select()
            .single();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ link }, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating social link:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
