/**
 * Example: Enhanced Profile Page Implementation
 * 
 * This file demonstrates how to use all 8 new profile components together
 * to create a complete enhanced profile page.
 */

'use client';

import { useState } from 'react';
import {
    EnhancedProfileLayout,
    PersonalDetailsPanel,
    ProfileHeader,
    TabNavigation,
    CreatedSoulsGrid,
    HighlightsSection,
    EmptyState,
    type UserProfileData,
    type Soul,
    type Highlight,
    type Tab,
} from '@/components/profile';
import { Users, MessageCircle, QrCode } from 'lucide-react';

// Example data
const exampleProfile: UserProfileData = {
    displayName: 'Jane Doe',
    username: 'janedoe',
    bio: 'AI enthusiast and character creator. Building amazing souls on Remrin!',
    location: 'San Francisco, CA',
    website: 'https://janedoe.com',
    joinDate: '2024-01-15',
    pronouns: 'she/her',
    stats: {
        followers: 1234,
        following: 567,
        posts: 89,
        likes: 4567,
    },
};

const exampleSouls: Soul[] = [
    {
        id: '1',
        name: 'Aurora',
        imageUrl: '/souls/aurora.jpg',
        rarity: 'legendary',
        tags: ['fantasy', 'magic'],
    },
    {
        id: '2',
        name: 'Kai',
        imageUrl: '/souls/kai.jpg',
        rarity: 'epic',
        tags: ['sci-fi', 'cyberpunk'],
    },
    // Add more souls...
];

const exampleHighlights: Highlight[] = [
    {
        id: '1',
        type: 'achievement',
        title: 'First Legendary Soul Created!',
        description: 'Created my first legendary character - Aurora the Enchantress',
        imageUrl: '/highlights/achievement1.jpg',
        date: '2024-03-15',
    },
    // Add more highlights...
];

export default function EnhancedProfilePage() {
    const [activeTab, setActiveTab] = useState('feed');
    const [isEditMode, setIsEditMode] = useState(false);

    const handleProfileUpdate = async (updates: Partial<UserProfileData>) => {
        console.log('Profile updates:', updates);
        // TODO: Send to API
    };

    const handleBannerUpdate = (file: File) => {
        console.log('Banner upload:', file);
        // TODO: Upload to Supabase Storage
    };

    const handleAvatarUpdate = (file: File) => {
        console.log('Avatar upload:', file);
        // TODO: Upload to Supabase Storage
    };

    return (
        <>
            {/* Profile Header */}
            <ProfileHeader
                bannerUrl="/profile/banner.jpg"
                avatarUrl="/profile/avatar.jpg"
                displayName={exampleProfile.displayName}
                username={exampleProfile.username}
                isOwnProfile={true}
                onBannerUpdate={handleBannerUpdate}
                onAvatarUpdate={handleAvatarUpdate}
                actions={
                    <>
                        <button className="px-6 py-2 border-2 border-rp-subtle text-rp-text rounded-lg hover:bg-rp-overlay transition-colors font-medium flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                            QR Code
                        </button>
                    </>
                }
            />

            {/* Main Layout */}
            <EnhancedProfileLayout
                isOwnProfile={true}
                onEditModeChange={setIsEditMode}
                sidebar={
                    <PersonalDetailsPanel
                        profile={exampleProfile}
                        isOwnProfile={true}
                        onUpdate={handleProfileUpdate}
                    />
                }
                mainContent={
                    <>
                        {/* Tab Navigation */}
                        <TabNavigation
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />

                        {/* Tab Content */}
                        <div className="space-y-6">
                            {activeTab === 'feed' && (
                                <div className="bg-rp-surface rounded-xl border border-rp-highlight-med p-6">
                                    <h2 className="text-xl font-bold text-rp-text mb-4">Feed</h2>
                                    <EmptyState
                                        variant="posts"
                                        title="No posts yet"
                                        description="Share your first post with the community!"
                                        action={{
                                            label: 'Create Post',
                                            onClick: () => console.log('Create post'),
                                        }}
                                    />
                                </div>
                            )}

                            {activeTab === 'work' && (
                                <div className="bg-rp-surface rounded-xl border border-rp-highlight-med p-6">
                                    <h2 className="text-xl font-bold text-rp-text mb-6">My Created Souls</h2>
                                    <CreatedSoulsGrid
                                        souls={exampleSouls}
                                        maxDisplay={6}
                                        showSeeAll={true}
                                        isOwnProfile={true}
                                        onSoulClick={(soul) => console.log('View soul:', soul)}
                                        onCreateSoul={() => console.log('Create soul')}
                                        onSeeAll={() => console.log('See all souls')}
                                    />
                                </div>
                            )}

                            {activeTab === 'about' && (
                                <div className="bg-rp-surface rounded-xl border border-rp-highlight-med p-6">
                                    <h2 className="text-xl font-bold text-rp-text mb-4">About</h2>
                                    <p className="text-rp-text">{exampleProfile.bio}</p>
                                </div>
                            )}
                        </div>
                    </>
                }
                rightPanel={
                    <HighlightsSection
                        highlights={exampleHighlights}
                        isOwnProfile={true}
                        isEditMode={isEditMode}
                        onAddHighlight={() => console.log('Add highlight')}
                        onRemoveHighlight={(id) => console.log('Remove highlight:', id)}
                        onHighlightClick={(highlight) => console.log('View highlight:', highlight)}
                    />
                }
            />
        </>
    );
}
