'use client';

import { useState, useEffect } from 'react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PersonalDetailsPanel } from '@/components/profile/PersonalDetailsPanel';
import { EnhancedProfileLayout } from '@/components/profile/EnhancedProfileLayout';
import { HighlightsSection, Highlight } from '@/components/profile/HighlightsSection';
import { CreatedSoulsGrid, Soul } from '@/components/profile/CreatedSoulsGrid';
import { EditModeProvider } from '@/components/profile/editable/EditModeProvider';
import { EditableField } from '@/components/profile/editable/EditableField';
import { RibbonBadge } from '@/components/profile/RibbonBadge';
import { QRCodeModal } from '@/components/profile/QRCodeModal';
import { UserProfile } from '@/types/profile';
import { toast } from 'sonner';
import { Sparkles, Users } from 'lucide-react';
import dynamic from 'next/dynamic';

const AnalyticsDashboard = dynamic(() => import('@/components/analytics/AnalyticsDashboard'), {
    loading: () => <div className="animate-pulse bg-rp-surface h-[400px] rounded-xl flex items-center justify-center text-rp-subtle font-medium border border-rp-highlight-med">Loading Analytics Dashboard...</div>,
    ssr: false
});

const FeedContainer = dynamic(() => import('@/components/feed/FeedContainer').then(mod => mod.FeedContainer), {
    loading: () => <div className="animate-pulse bg-rp-surface h-[400px] rounded-xl flex items-center justify-center text-rp-subtle font-medium border border-rp-highlight-med">Loading Community Feed...</div>,
    ssr: false
});

interface ProfileClientProps {
    profile: UserProfile & {
        user_achievements?: any[];
        social_links?: any[];
        featured_creations?: any[];
    };
    isOwnProfile: boolean;
}

export function ProfileClient({ profile: initialProfile, isOwnProfile }: ProfileClientProps) {
    const [profile, setProfile] = useState(initialProfile);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoadingFollow, setIsLoadingFollow] = useState(false);
    const [activeTab, setActiveTab] = useState<'work' | 'feed' | 'about' | 'statistics' | 'achievements'>('work');

    // Load follow status on mount
    useEffect(() => {
        if (!isOwnProfile) {
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
            loadFollowStatus();
        }
    }, [profile.user_id, isOwnProfile]);

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

    const handleProfileUpdate = async (updates: Partial<UserProfile>) => {
        try {
            const response = await fetch(`/api/profile/${profile.user_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error('Failed to update profile');

            setProfile(prev => ({ ...prev, ...updates }));
            toast.success('Successfully updated profile');
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Failed to save changes. Please try again.');
            throw error;
        }
    };

    const handleImageUpload = async (file: File, type: 'avatar' | 'banner') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        toast.loading(`Uploading ${type}...`);
        try {
            const response = await fetch('/api/profile/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || `Failed to upload ${type}`);
            }

            const data = await response.json();
            const updateField = type === 'banner' ? 'banner_url' : 'hero_image_url';

            setProfile(prev => ({ ...prev, [updateField]: data.url }));
            toast.dismiss();
            toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`);
        } catch (error: any) {
            console.error(`Error uploading ${type}:`, error);
            toast.dismiss();
            toast.error(error.message || `Failed to upload ${type}`);
        }
    };

    // Data Mappings for specialized components
    const userData = {
        displayName: profile.display_name || profile.username,
        username: profile.username,
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website_url || '',
        joinDate: profile.created_at,
        pronouns: profile.pronouns || '',
        stats: {
            followers: 0, // In a real app, these would be reactive or fetched
            following: 0,
            posts: profile.featured_creations?.length || 0,
            likes: 0
        },
        socialLinks: profile.social_links?.map(l => ({ platform: l.platform, url: l.url })) || []
    };

    // Map all personas to Soul format for CreatedSoulsGrid
    const souls: Soul[] = ((profile as any).personas || []).map((persona: any) => ({
        id: persona.id,
        name: persona.name,
        imageUrl: persona.image_url || persona.image_path || undefined,
        rarity: 'common' as const,
        tags: []
    }));

    const highlights: Highlight[] = profile.featured_creations?.slice(0, 3).map(fc => ({
        id: fc.id,
        type: 'media',
        title: fc.persona?.name || 'Featured Work',
        description: fc.persona?.description || '',
        imageUrl: fc.persona?.image_url,
        date: fc.created_at
    })) || [];

    // Sidebar Content (Left Column)
    const sidebar = (
        <PersonalDetailsPanel
            profile={userData}
            isOwnProfile={isOwnProfile}
            onUpdate={(updates) => handleProfileUpdate({
                bio: updates.bio,
                location: updates.location,
                website_url: updates.website,
                pronouns: updates.pronouns
            })}
        />
    );

    // Main Content Sections (Middle Column)
    const mainContent = (
        <div className="space-y-8">
            {/* Tabs Navigation */}
            <div className="border-b border-rp-highlight-low">
                <div className="flex gap-8 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'work', label: 'Work' },
                        { id: 'feed', label: 'Feed' },
                        { id: 'about', label: 'About' },
                        { id: 'statistics', label: 'Statistics' },
                        { id: 'achievements', label: 'Achievements' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'text-rp-iris border-rp-iris translate-y-[1px]'
                                : 'text-rp-subtle border-transparent hover:text-rp-text'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Views with Animations */}
            <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'work' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-rp-text flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-rp-gold" />
                                Created Souls
                            </h2>
                            {isOwnProfile && (
                                <button
                                    onClick={() => window.location.href = '/studio'}
                                    className="text-sm font-bold text-rp-iris hover:underline"
                                >
                                    Manage Studio
                                </button>
                            )}
                        </div>
                        <CreatedSoulsGrid
                            souls={souls}
                            isOwnProfile={isOwnProfile}
                            onCreateSoul={() => window.location.href = '/studio'}
                        />
                    </div>
                )}

                {activeTab === 'feed' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <FeedContainer />
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="max-w-3xl space-y-8 bg-rp-surface p-8 rounded-3xl shadow-xl shadow-rp-base/50">
                        <section>
                            <h3 className="text-xs font-bold text-rp-subtle uppercase tracking-widest mb-4">Bio & Vision</h3>
                            <EditableField
                                value={profile.bio || ''}
                                placeholder="Describe your creative vision..."
                                onSave={(val) => handleProfileUpdate({ bio: val })}
                                disabled={!isOwnProfile}
                                className="text-lg leading-relaxed text-rp-text"
                            />
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-rp-highlight-low">
                            <div>
                                <h3 className="text-xs font-bold text-rp-subtle uppercase tracking-widest mb-3">Location</h3>
                                <EditableField
                                    value={profile.location || ''}
                                    placeholder="Where in the metaverse?"
                                    onSave={(val) => handleProfileUpdate({ location: val })}
                                    disabled={!isOwnProfile}
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-rp-subtle uppercase tracking-widest mb-3">Website</h3>
                                <EditableField
                                    value={profile.website_url || ''}
                                    placeholder="https://yourhq.com"
                                    onSave={(val) => handleProfileUpdate({ website_url: val })}
                                    disabled={!isOwnProfile}
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-rp-subtle uppercase tracking-widest mb-3">Pronouns</h3>
                                <EditableField
                                    value={profile.pronouns || ''}
                                    placeholder="How should we refer to you?"
                                    onSave={(val) => handleProfileUpdate({ pronouns: val })}
                                    disabled={!isOwnProfile}
                                />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-rp-subtle uppercase tracking-widest mb-3">Joined</h3>
                                <div className="px-3 py-2 text-rp-text font-medium bg-rp-base/30 rounded-lg border border-rp-highlight-low w-fit">
                                    {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'statistics' && <AnalyticsDashboard />}

                {activeTab === 'achievements' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.user_achievements && profile.user_achievements.length > 0 ? (
                            profile.user_achievements.map((ua: any) => (
                                <div key={ua.id} className="bg-rp-surface p-6 rounded-2xl flex items-center gap-6 hover:shadow-lg hover:shadow-rp-iris/10 transition-all group">
                                    <div className="text-5xl bg-rp-overlay w-20 h-20 flex items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                                        {ua.achievement?.icon || '🏆'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl text-rp-text">{ua.achievement?.name}</h4>
                                        <p className="text-sm text-rp-subtle mt-1">{ua.achievement?.description}</p>
                                        <div className="mt-3 inline-block px-2 py-0.5 rounded bg-rp-highlight-low text-[10px] uppercase font-bold text-rp-muted">
                                            Earned {new Date(ua.earned_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center bg-rp-surface rounded-3xl border-2 border-dashed border-rp-highlight-med">
                                <p className="text-rp-subtle font-medium">No legacy achievements recorded yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // Right Panel (Right Column)
    const rightPanel = (
        <HighlightsSection
            highlights={highlights}
            isOwnProfile={isOwnProfile}
            onAddHighlight={() => toast.info('Highlight selection interface is coming in the next update!')}
        />
    );

    return (
        <EditModeProvider>
            <div className="min-h-screen bg-rp-base text-rp-text selection:bg-rp-iris/30 selection:text-rp-iris">
                <ProfileHeader
                    bannerUrl={profile.banner_url || undefined}
                    avatarUrl={profile.hero_image_url || undefined}
                    displayName={profile.display_name || profile.username}
                    username={profile.username}
                    isOwnProfile={isOwnProfile}
                    onBannerUpdate={(file) => handleImageUpload(file, 'banner')}
                    onAvatarUpdate={(file) => handleImageUpload(file, 'avatar')}
                    actions={
                        <div className="flex gap-4 items-center">
                            {!isOwnProfile && (
                                <button
                                    onClick={handleFollow}
                                    disabled={isLoadingFollow}
                                    className={`px-8 py-2.5 rounded-full font-bold transition-all ${isFollowing
                                        ? 'bg-rp-overlay text-rp-text border border-rp-highlight-med hover:bg-rp-surface'
                                        : 'bg-rp-iris text-white hover:shadow-lg hover:shadow-rp-iris/20 active:scale-95'
                                        }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowQRModal(true)}
                                className="p-2.5 bg-rp-surface border border-rp-highlight-med rounded-full text-rp-text hover:bg-rp-overlay hover:border-rp-iris transition-all active:scale-90"
                                aria-label="Show QR Code"
                            >
                                <Users className="w-5 h-5" />
                            </button>
                        </div>
                    }
                />

                <EnhancedProfileLayout
                    sidebar={sidebar}
                    mainContent={mainContent}
                    rightPanel={rightPanel}
                    isOwnProfile={isOwnProfile}
                />

                <QRCodeModal
                    isOpen={showQRModal}
                    onClose={() => setShowQRModal(false)}
                    username={profile.username}
                />
            </div>
        </EditModeProvider>
    );
}
