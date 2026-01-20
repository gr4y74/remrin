import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { collectionUpdateSchema } from '@/lib/validation/collectionValidation';
import { z } from 'zod';

export async function GET(
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

        const { data: collection, error } = await supabase
            .from('user_collections')
            .select(`
                *,
                items:collection_items(
                    *,
                    persona:personas(*)
                )
            `)
            .eq('id', params.id)
            .single();

        if (error) {
            console.error('Error fetching collection:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Check ownership/visibility
        if (collection.user_id !== user.id && collection.visibility !== 'PUBLIC') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json({ collection });
    } catch (error) {
        console.error('Error in GET /api/collections/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
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

        const body = await request.json();
        const validatedData = collectionUpdateSchema.parse(body);

        const { data: collection, error } = await supabase
            .from('user_collections')
            .update(validatedData)
            .eq('id', params.id)
            .eq('user_id', user.id) // Ensure ownership
            .select()
            .single();

        if (error) {
            console.error('Error updating collection:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ collection });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Error in PUT /api/collections/[id]:', error);
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

        const { error } = await supabase
            .from('user_collections')
            .delete()
            .eq('id', params.id)
            .eq('user_id', user.id); // Ensure ownership

        if (error) {
            console.error('Error deleting collection:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/collections/[id]:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
