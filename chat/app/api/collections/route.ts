import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { collectionCreateSchema } from '@/lib/validation/collectionValidation';
import { z } from 'zod';

export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: collections, error } = await supabase
            .from('user_collections')
            .select(`
                *,
                items:collection_items(count)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching collections:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ collections });
    } catch (error) {
        console.error('Error in GET /api/collections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = collectionCreateSchema.parse(body);

        const { data: collection, error } = await supabase
            .from('user_collections')
            .insert({
                ...validatedData,
                user_id: user.id
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating collection:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ collection });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Error in POST /api/collections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
