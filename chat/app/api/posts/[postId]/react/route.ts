import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const reactSchema = z.object({
    reaction_type: z.enum(['like', 'love', 'celebrate', 'insightful']).optional(), // Optional to allow removing
});

export async function POST(
    request: NextRequest,
    { params }: { params: { postId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { postId } = params;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { reaction_type } = reactSchema.parse(body);

        if (!reaction_type) {
            // Remove reaction
            const { error } = await supabase
                .from('post_reactions')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json({ message: 'Reaction removed' });
        }

        // Add or update reaction
        const { data: reaction, error } = await supabase
            .from('post_reactions')
            .upsert({
                post_id: postId,
                user_id: user.id,
                reaction_type,
            }, { onConflict: 'post_id, user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error adding reaction:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ reaction });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/posts/[postId]/react:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
