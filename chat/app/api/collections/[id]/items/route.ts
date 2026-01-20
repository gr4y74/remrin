import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { collectionItemSchema } from '@/lib/validation/collectionValidation';
import { z } from 'zod';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify collection ownership
        const { data: collection, error: collectionError } = await supabase
            .from('user_collections')
            .select('id')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (collectionError || !collection) {
            return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = collectionItemSchema.parse(body);

        // Add item to collection
        const { data: item, error } = await supabase
            .from('collection_items')
            .insert({
                collection_id: params.id,
                persona_id: validatedData.persona_id,
                order_index: validatedData.order_index ?? 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding item to collection:', error);
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json({ error: 'Character already in collection' }, { status: 400 });
            }
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ item });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/collections/[id]/items:', error);
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

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { persona_id } = await request.json();

        if (!persona_id) {
            return NextResponse.json({ error: 'persona_id is required' }, { status: 400 });
        }

        // Verify collection ownership and delete item
        // We can do this in one go by joining with user_collections in the USING clause or just checking owner first
        const { data: collection, error: collectionError } = await supabase
            .from('user_collections')
            .select('id')
            .eq('id', params.id)
            .eq('user_id', user.id)
            .single();

        if (collectionError || !collection) {
            return NextResponse.json({ error: 'Collection not found or access denied' }, { status: 404 });
        }

        const { error: deleteError } = await supabase
            .from('collection_items')
            .delete()
            .eq('collection_id', params.id)
            .eq('persona_id', persona_id);

        if (deleteError) {
            console.error('Error removing item from collection:', deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/collections/[id]/items:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
