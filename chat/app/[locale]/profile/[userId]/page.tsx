import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProfileBanner } from '@/components/profile/ProfileBanner';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { RibbonBadge } from '@/components/profile/RibbonBadge';

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

    // Combine profile with related data
    const profile = {
        ...profileBase,
        user_achievements: achievementsResult.data || [],
        social_links: socialLinksResult.data || [],
        featured_creations: featuredResult.data || []
    };

    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user?.id === profile.user_id;

    // Get top 5 badges for ribbon showcase
    const topBadges = profile.user_achievements
        ?.filter((ua: any) => ua.is_displayed)
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        ?.slice(0, 5) || [];

    return (
        <div className="min-h-screen bg-rose-pine-surface">
            {/* Banner with Ribbons */}
            <div className="relative">
                <ProfileBanner
                    bannerUrl={profile.banner_url}
                    isOwnProfile={isOwnProfile}
                />

                {/* Ribbon Showcase */}
                <div className="absolute top-5 right-10 flex gap-3 z-20">
                    {topBadges.map((ua: any) => (
                        <RibbonBadge
                            key={ua.id}
                            icon={ua.achievement.icon}
                            name={ua.achievement.name}
                            earnedDate={ua.earned_date}
                            colorGradient={ua.achievement.color_gradient}
                            rarity={ua.achievement.rarity}
                            size="small"
                        />
                    ))}
                </div>
            </div>

            {/* Profile Info Card */}
            <div className="max-w-7xl mx-auto px-8">
                <ProfileInfoCard
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                />

                {/* Navigation Tabs */}
                <nav className="border-b border-rose-pine-highlight mt-8">
                    <ul className="flex gap-8">
                        {['Work', 'About', 'Statistics', 'Achievements', 'Collections'].map(tab => (
                            <li key={tab}>
                                <button className="px-4 py-3 text-sm font-semibold text-rose-pine-text border-b-2 border-transparent hover:border-rose-pine-love transition-colors">
                                    {tab}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8 pb-16">
                    {/* Sidebar */}
                    <aside className="lg:col-span-1 space-y-6">
                        {profile.bio && (
                            <div className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight">
                                <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-4">About</h3>
                                <p className="text-sm text-rose-pine-text leading-relaxed">{profile.bio}</p>
                            </div>
                        )}
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {profile.featured_creations?.map((fc: any) => (
                                <div key={fc.id} className="bg-rose-pine-base rounded-lg overflow-hidden border border-rose-pine-highlight hover:border-rose-pine-love transition-colors">
                                    <div className="h-48 bg-gradient-to-br from-rose-pine-love to-rose-pine-gold" />
                                    <div className="p-4">
                                        <h4 className="font-semibold text-rose-pine-text">{fc.persona.name}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
