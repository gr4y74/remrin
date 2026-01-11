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
    customization_json: z.record(z.any()).optional(),
    privacy_settings: z.object({
        profile: z.enum(['public', 'friends', 'private']).optional(),
        analytics: z.enum(['public', 'friends', 'private']).optional(),
        badges: z.enum(['public', 'friends', 'private']).optional(),
    }).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { userId } = params;

        // Fetch profile - support fetching by either user_id (UUID) or username
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        // First, fetch just the profile without joins to ensure we find the user
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq(isUuid ? 'user_id' : 'username', userId)
            .single();

        if (profileError || !profile) {
            console.error('Profile fetch error:', profileError?.message, 'userId:', userId, 'isUuid:', isUuid);
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Fetch related data separately
        const [achievementsResult, socialLinksResult, featuredResult] = await Promise.all([
            supabase
                .from('user_achievements')
                .select('*, achievement:achievements (*)')
                .eq('user_id', profile.user_id),
            supabase
                .from('social_links')
                .select('*')
                .eq('user_id', profile.user_id),
            supabase
                .from('featured_creations')
                .select('*, persona:personas (*)')
                .eq('user_id', profile.user_id)
        ]);

        // Combine profile with related data
        const fullProfile = {
            ...profile,
            user_achievements: achievementsResult.data || [],
            social_links: socialLinksResult.data || [],
            featured_creations: featuredResult.data || []
        };

        // Check privacy settings
        const { data: { user } } = await supabase.auth.getUser();
        const isOwnProfile = user?.id === profile.user_id;

        if (!isOwnProfile && profile.privacy_settings?.profile === 'private') {
            return NextResponse.json({ error: 'Profile is private' }, { status: 403 });
        }

        return NextResponse.json({ profile: fullProfile });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const cookieStore = cookies();
        const supabase = createClient(cookieStore);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updateProfileSchema.parse(body);

        // Verify user owns this profile
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq(isUuid ? 'user_id' : 'username', params.userId)
            .single();

        if (profile?.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update profile
        const { data: updated, error } = await supabase
            .from('user_profiles')
            .update(validatedData)
            .eq('user_id', profile.user_id)
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

export async function PATCH(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    return PUT(request, { params });
}
