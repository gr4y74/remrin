import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
    display_name: z.string().max(100).optional(),
    bio: z.string().max(1000).optional(),
    pronouns: z.string().max(50).optional(),
    location: z.string().max(100).optional(),
    website_url: z.string().optional().or(z.literal('')),
    hero_image_url: z.string().url().optional().or(z.literal('')),
    banner_url: z.string().url().optional().or(z.literal('')),
});

/**
 * GET /api/profile/me
 * Get or create the current user's profile
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Try to get existing user_profile
        let { data: userProfile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // If no user_profile exists, create one
        if (error || !userProfile) {
            const username = user.user_metadata?.username ||
                user.user_metadata?.name?.replace(/\s+/g, '').toLowerCase().substring(0, 20) ||
                user.email?.split('@')[0] ||
                `user_${Math.random().toString(36).substring(2, 10)}`;

            const { data: newProfile, error: insertError } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: user.id,
                    username: username,
                    display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
                    bio: '',
                    pronouns: '',
                    location: '',
                    website_url: '',
                    banner_url: '',
                    hero_image_url: user.user_metadata?.avatar_url || '',
                    privacy_settings: {
                        profile: 'public',
                        analytics: 'private',
                        badges: 'public'
                    },
                    customization_json: {
                        theme: 'default',
                        accentColor: '#eb6f92'
                    }
                })
                .select()
                .single();

            if (insertError) {
                console.error('Error creating user_profile:', insertError);
                return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
            }

            userProfile = newProfile;
        }

        // Also get legacy/internal profile for full picture
        const { data: internalProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

        // Merge them - user_profiles takes precedence for social fields
        const mergedProfile = {
            ...(internalProfile || {}),
            ...(userProfile || {}),
            // Ensure social image URLs are properly mapped
            image_url: userProfile?.hero_image_url || internalProfile?.image_url,
            banner_url: userProfile?.banner_url || internalProfile?.banner_url || '',
            hero_image_url: userProfile?.hero_image_url || internalProfile?.image_url || ''
        };

        return NextResponse.json({ profile: mergedProfile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/profile/me
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updateProfileSchema.parse(body);

        // Ensure user has a profile first
        const { data: existingProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!existingProfile) {
            return NextResponse.json({ error: 'Profile not found. Please GET first to create.' }, { status: 404 });
        }

        const { data: updated, error } = await supabase
            .from('user_profiles')
            .update(validatedData)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ profile: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
