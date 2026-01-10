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

    // First, fetch just the profile without joins
    const { data: profileBase, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq(isUuid ? 'user_id' : 'username', params.userId)
        .single();

    if (profileError || !profileBase) {
        notFound();
    }

    // Fetch related data separately (these may be empty and that's OK)
    const [achievementsResult, socialLinksResult, featuredResult] = await Promise.all([
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
            .eq('user_id', profileBase.user_id)
    ]);

    // Fetch avatar from profiles table
    const { data: profileData } = await supabase
        .from('profiles')
        .select('image_url')
        .eq('user_id', profileBase.user_id)
        .single();

    // Combine profile with related data and avatar
    const profile = {
        ...profileBase,
        hero_image_url: profileData?.image_url || null,
        user_achievements: achievementsResult.data || [],
        social_links: socialLinksResult.data || [],
        featured_creations: featuredResult.data || []
    };

    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.user_id;

    return <ProfileClient profile={profile} isOwnProfile={isOwnProfile} />;
}
