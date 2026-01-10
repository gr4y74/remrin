import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateSocialLinkSchema = z.object({
    platform: z.string().min(1).max(50).optional(),
    handle: z.string().max(100).optional(),
    url: z.string().url().optional(),
    display_order: z.number().int().min(0).optional(),
});

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updateSocialLinkSchema.parse(body);

        // Verify ownership
        const { data: existing } = await supabase
            .from('social_links')
            .select('user_id')
            .eq('id', params.id)
            .single();

        if (!existing || existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const { data: link, error } = await supabase
            .from('social_links')
            .update(validatedData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating social link:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ link });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in PUT /api/profile/social-links/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const { data: existing } = await supabase
            .from('social_links')
            .select('user_id')
            .eq('id', params.id)
            .single();

        if (!existing || existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const { error } = await supabase
            .from('social_links')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting social link:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/profile/social-links/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
