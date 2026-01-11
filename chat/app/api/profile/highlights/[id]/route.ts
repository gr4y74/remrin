import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { id } = params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // First check if it's a showcase item
        const { data: highlight } = await supabase
            .from('showcase_items')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (highlight) {
            await supabase
                .from('showcase_items')
                .delete()
                .eq('id', id);

            if (highlight.item_type === 'post') {
                await supabase
                    .from('posts')
                    .update({ is_pinned: false })
                    .eq('id', highlight.item_id)
                    .eq('user_id', user.id);
            }

            return NextResponse.json({ message: 'Highlight removed' });
        }

        return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
    } catch (error) {
        console.error('Error in DELETE /api/profile/highlights/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
