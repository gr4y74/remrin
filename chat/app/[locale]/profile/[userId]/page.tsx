import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProfileClient } from '@/components/profile/ProfileClient';

export async function generateMetadata({ params }: { params: { userId: string } }) {
    const supabase = createClient(cookies());
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, bio, username')
        .eq(isUuid ? 'user_id' : 'username', params.userId)
        .single();

    return {
        title: `${profile?.display_name || profile?.username || 'Profile'} - Remrin.ai`,
        description: profile?.bio || `View ${profile?.username || 'user'}'s profile on Remrin.ai`,
    };
}

export default async function ProfilePage({ params }: { params: { userId: string } }) {
    const supabase = createClient(cookies());
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);

    // First, fetch from user_profiles
    let { data: profileBase, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq(isUuid ? 'user_id' : 'username', params.userId)
        .maybeSingle(); // Use maybeSingle to handle missing record without erroring immediately

    // Fallback to profiles table if not found in user_profiles
    if (!profileBase) {
        const { data: fallbackProfile, error: fallbackError } = await supabase
            .from('profiles')
            .select('*')
            .eq(isUuid ? 'user_id' : 'username', params.userId)
            .maybeSingle();

        if (fallbackError || !fallbackProfile) {
            notFound();
        }

        // Map profiles structure to user_profiles structure for the UI
        profileBase = {
            id: fallbackProfile.id,
            user_id: fallbackProfile.user_id || fallbackProfile.id,
            username: fallbackProfile.username,
            display_name: fallbackProfile.display_name,
            bio: fallbackProfile.bio,
            avatar_url: fallbackProfile.image_url,
            created_at: fallbackProfile.created_at,
            updated_at: fallbackProfile.updated_at,
            // Add other required fields with defaults
            cover_image_url: null,
            website_url: null,
            location: null,
            pronouns: null,
            is_verified: false
        };
    }

    // Fetch related data separately (these may be empty and that's OK)
    const [achievementsResult, socialLinksResult, featuredResult, personasResult] = await Promise.all([
        supabase
            .from('user_achievements')
            .select('*, achievement:achievements (*)')
            .eq('user_id', profileBase.user_id),
        supabase
            .from('social_links')
            .select('*')
            .eq('user_id', profileBase.user_id),
        supabase
            .from('featured_creations')
            .select('*, persona:personas (*)')
            .eq('user_id', profileBase.user_id),
        supabase
            .from('personas')
            .select('*')
            .eq('creator_id', profileBase.user_id)
            .order('created_at', { ascending: false })
    ]);

    // Fetch avatar from profiles table as fallback
    const { data: profileData } = await supabase
        .from('profiles')
        .select('image_url')
        .eq('user_id', profileBase.user_id)
        .single();

    // Combine profile with related data
    // Prioritize user_profiles fields, only use profiles.image_url as fallback
    const profile = {
        ...profileBase,
        // Keep hero_image_url from user_profiles, fallback to profiles.image_url
        hero_image_url: profileBase.hero_image_url || profileData?.image_url || null,
        // Keep banner_url from user_profiles
        banner_url: profileBase.banner_url || null,
        user_achievements: achievementsResult.data || [],
        social_links: socialLinksResult.data || [],
        featured_creations: featuredResult.data || [],
        personas: personasResult.data || []
    };

    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.user_id;

    return <ProfileClient profile={profile} isOwnProfile={isOwnProfile} />;
}
