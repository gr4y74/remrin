import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { postId } = params;

        const { data: reactions, error } = await supabase
            .from('post_reactions')
            .select(`
                *,
                user:user_profiles!post_reactions_user_id_fkey(username, display_name, avatar_url, hero_image_url)
            `)
            .eq('post_id', postId);

        if (error) {
            console.error('Error fetching reactions:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ reactions: reactions || [] });
    } catch (error) {
        console.error('Error in GET /api/posts/[postId]/reactions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
