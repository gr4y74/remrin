'use client';

import { useState, useEffect } from 'react';
import { ProfileBanner } from '@/components/profile/ProfileBanner';
import { ProfileInfoCard } from '@/components/profile/ProfileInfoCard';
import { RibbonBadge } from '@/components/profile/RibbonBadge';
import { QRCodeModal } from '@/components/profile/QRCodeModal';
import { UserProfile } from '@/types/profile';
import { toast } from 'sonner';

interface ProfileClientProps {
    profile: UserProfile & {
        user_achievements?: any[];
        social_links?: any[];
        featured_creations?: any[];
    };
    isOwnProfile: boolean;
}

export function ProfileClient({ profile, isOwnProfile }: ProfileClientProps) {
    const [showQRModal, setShowQRModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [activeTab, setActiveTab] = useState<'work' | 'about' | 'statistics' | 'achievements' | 'collections'>('work');

    // Get top 5 badges for ribbon showcase
    const topBadges = profile.user_achievements
        ?.filter((ua: any) => ua.is_displayed)
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        ?.slice(0, 5) || [];

    // Load follow status on mount
    useEffect(() => {
        if (!isOwnProfile) {
            loadFollowStatus();
        }
    }, [profile.user_id, isOwnProfile]);

    const loadFollowStatus = async () => {
        try {
            const response = await fetch(`/api/profile/${profile.user_id}/follow`);
            const data = await response.json();
            if (response.ok) {
                setIsFollowing(data.isFollowing);
            }
        } catch (error) {
            console.error('Error loading follow status:', error);
        }
    };

    const handleFollow = async () => {
        setIsLoadingFollow(true);
        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const response = await fetch(`/api/profile/${profile.user_id}/follow`, {
                method,
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
                toast.success(isFollowing ? 'Unfollowed' : 'Following!');
            } else {
                const data = await response.json();
                toast.error(data.error || 'Failed to update follow status');
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            toast.error('Failed to update follow status');
        } finally {
            setIsLoadingFollow(false);
        }
    };

    const handleMessage = () => {
        // TODO: Implement messaging
        console.log('Message clicked');
    };

    const handleShowQR = () => {
        setShowQRModal(true);
    };

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
                    onFollow={handleFollow}
                    onMessage={handleMessage}
                    onShowQR={handleShowQR}
                />

                {/* Navigation Tabs */}
                <nav className="border-b border-rose-pine-highlight mt-8">
                    <ul className="flex gap-8">
                        {[
                            { id: 'work', label: 'Work' },
                            { id: 'about', label: 'About' },
                            { id: 'statistics', label: 'Statistics' },
                            { id: 'achievements', label: 'Achievements' },
                            { id: 'collections', label: 'Collections' }
                        ].map(tab => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab.id
                                        ? 'text-rose-pine-love border-rose-pine-love'
                                        : 'text-rose-pine-text border-transparent hover:border-rose-pine-love'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Tab Content */}
                <div className="mt-8 pb-16">
                    {/* Work Tab */}
                    {activeTab === 'work' && (
                        <div>
                            <h2 className="text-2xl font-bold text-rose-pine-text mb-6">Featured Work</h2>
                            {profile.featured_creations && profile.featured_creations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {profile.featured_creations.map((fc: any) => (
                                        <div key={fc.id} className="bg-rose-pine-base rounded-lg overflow-hidden border border-rose-pine-highlight hover:border-rose-pine-love transition-colors cursor-pointer">
                                            <div className="h-48 bg-gradient-to-br from-rose-pine-love to-rose-pine-gold" />
                                            <div className="p-4">
                                                <h4 className="font-semibold text-rose-pine-text">{fc.persona?.name || 'Untitled'}</h4>
                                                {fc.persona?.description && (
                                                    <p className="text-sm text-rose-pine-subtle mt-2 line-clamp-2">{fc.persona.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-rose-pine-base rounded-lg border border-rose-pine-highlight">
                                    <p className="text-rose-pine-subtle">No featured creations yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <div className="max-w-3xl">
                            <h2 className="text-2xl font-bold text-rose-pine-text mb-6">About</h2>
                            <div className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight space-y-4">
                                {profile.bio && (
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Bio</h3>
                                        <p className="text-rose-pine-text leading-relaxed">{profile.bio}</p>
                                    </div>
                                )}
                                {profile.pronouns && (
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Pronouns</h3>
                                        <p className="text-rose-pine-text">{profile.pronouns}</p>
                                    </div>
                                )}
                                {profile.location && (
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Location</h3>
                                        <p className="text-rose-pine-text">{profile.location}</p>
                                    </div>
                                )}
                                {profile.website_url && (
                                    <div>
                                        <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Website</h3>
                                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-rose-pine-love hover:underline">
                                            {profile.website_url}
                                        </a>
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Joined</h3>
                                    <p className="text-rose-pine-text">{new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Statistics Tab */}
                    {activeTab === 'statistics' && (
                        <div>
                            <h2 className="text-2xl font-bold text-rose-pine-text mb-6">Statistics</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight">
                                    <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Profile Views</h3>
                                    <p className="text-3xl font-bold text-rose-pine-text">-</p>
                                    <p className="text-xs text-rose-pine-subtle mt-1">Coming soon</p>
                                </div>
                                <div className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight">
                                    <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Followers</h3>
                                    <p className="text-3xl font-bold text-rose-pine-text">-</p>
                                    <p className="text-xs text-rose-pine-subtle mt-1">Coming soon</p>
                                </div>
                                <div className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight">
                                    <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Following</h3>
                                    <p className="text-3xl font-bold text-rose-pine-text">-</p>
                                    <p className="text-xs text-rose-pine-subtle mt-1">Coming soon</p>
                                </div>
                                <div className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight">
                                    <h3 className="text-sm font-bold text-rose-pine-subtle uppercase mb-2">Creations</h3>
                                    <p className="text-3xl font-bold text-rose-pine-text">{profile.featured_creations?.length || 0}</p>
                                    <p className="text-xs text-rose-pine-subtle mt-1">Featured</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Achievements Tab */}
                    {activeTab === 'achievements' && (
                        <div>
                            <h2 className="text-2xl font-bold text-rose-pine-text mb-6">Achievements</h2>
                            {profile.user_achievements && profile.user_achievements.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {profile.user_achievements.map((ua: any) => (
                                        <div key={ua.id} className="bg-rose-pine-base rounded-lg p-6 border border-rose-pine-highlight hover:border-rose-pine-love transition-colors">
                                            <div className="flex items-start gap-4">
                                                <div className="text-4xl">{ua.achievement?.icon || '🏆'}</div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-rose-pine-text">{ua.achievement?.name || 'Achievement'}</h3>
                                                    <p className="text-sm text-rose-pine-subtle mt-1">{ua.achievement?.description || 'No description'}</p>
                                                    <p className="text-xs text-rose-pine-muted mt-2">Earned {new Date(ua.earned_date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-rose-pine-base rounded-lg border border-rose-pine-highlight">
                                    <p className="text-rose-pine-subtle">No achievements earned yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Collections Tab */}
                    {activeTab === 'collections' && (
                        <div className="text-center py-12 bg-rose-pine-base rounded-lg border border-rose-pine-highlight">
                            <p className="text-rose-pine-subtle">Collections feature coming soon</p>
                        </div>
                    )}
                </div>
            </div>

            {/* QR Code Modal */}
            <QRCodeModal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                username={profile.username}
            />
        </div>
    );
}
