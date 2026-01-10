import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const updateFeaturedSchema = z.object({
    persona_ids: z.array(z.string().uuid()).max(3),
});
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }
        const { data: featured, error } = await supabase
            .from('featured_creations')
            .select(`
        *,
        persona:personas (*)
      `)
            .eq('user_id', userId)
            .order('display_order', { ascending: true });
        if (error) {
            throw error;
        }
        return NextResponse.json({ featured });
    } catch (error) {
        console.error('Error fetching featured creations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function PUT(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { persona_ids } = updateFeaturedSchema.parse(body);
        // Delete existing featured creations
        await supabase
            .from('featured_creations')
            .delete()
            .eq('user_id', user.id);
        // Insert new featured creations
        const inserts = persona_ids.map((persona_id, index) => ({
            user_id: user.id,
            persona_id,
            display_order: index,
        }));
        const { data: featured, error } = await supabase
            .from('featured_creations')
            .insert(inserts)
            .select();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ featured });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error updating featured creations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
