import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { profileUpdateSchema } from '@/lib/validation/profileValidation';
import { z } from 'zod';

export async function PATCH(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = profileUpdateSchema.parse(body);

        // Remove undefined values
        const updateData = Object.fromEntries(
            Object.entries(validatedData).filter(([_, value]) => value !== undefined)
        );

        // Update the profiles table
        const { data: profile, error: updateError } = await supabase
            .from('profiles')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return NextResponse.json(
                { error: updateError.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            profile,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }

        console.error('Error in PATCH /api/profile/update:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
