'use client';

import { MapPin, Calendar, Globe, Users, Heart, MessageCircle, Info } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { SocialLinksDisplay } from './SocialLinksDisplay';
import { EditableField } from './editable/EditableField';
import { EditableTextarea } from './editable/EditableTextarea';

/**
 * User profile data structure for the sidebar
 */
export interface UserProfileData {
    displayName: string;
    username: string;
    bio?: string;
    location?: string;
    website?: string;
    joinDate: string;
    pronouns?: string;
    stats: {
        followers: number;
        following: number;
        posts: number;
        likes: number;
    };
    socialLinks?: Array<{
        platform: string;
        url: string;
        handle?: string;
    }>;
}

interface PersonalDetailsPanelProps {
    profile: UserProfileData;
    isOwnProfile?: boolean;
    onUpdate?: (updates: Partial<UserProfileData>) => Promise<void>;
}

/**
 * PersonalDetailsPanel - Enhanced sidebar panel with inline editing and social integration
 */
export function PersonalDetailsPanel({
    profile,
    isOwnProfile = false,
    onUpdate,
}: PersonalDetailsPanelProps) {

    const handleUpdate = async (field: keyof UserProfileData, value: string) => {
        if (onUpdate) {
            await onUpdate({ [field]: value });
        }
    };

    return (
        <div className="bg-rp-surface rounded-3xl p-8 space-y-8 shadow-xl shadow-rp-base/50">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-rp-text flex items-center gap-2">
                    <Info className="w-5 h-5 text-rp-iris" />
                    Identity
                </h2>
            </div>

            {/* Bio Section */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-rp-subtle uppercase tracking-[0.2em] px-1">Biography</label>
                <div className="relative group">
                    <EditableTextarea
                        value={profile.bio || ''}
                        onSave={(val) => handleUpdate('bio', val)}
                        disabled={!isOwnProfile}
                        placeholder="Share your story with the community..."
                        className="text-rp-text leading-relaxed"
                        minRows={3}
                    />
                </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-5">
                {/* Location */}
                <div className="flex items-start gap-4 group/item">
                    <div className="p-2 bg-rp-overlay rounded-xl text-rp-subtle group-hover/item:text-rp-iris transition-colors">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-rp-subtle uppercase tracking-[0.2em] block mb-0.5">Location</label>
                        <EditableField
                            value={profile.location || ''}
                            onSave={(val) => handleUpdate('location', val)}
                            disabled={!isOwnProfile}
                            placeholder="Metaverse / Earth"
                        />
                    </div>
                </div>

                {/* Website */}
                <div className="flex items-start gap-4 group/item">
                    <div className="p-2 bg-rp-overlay rounded-xl text-rp-subtle group-hover/item:text-rp-foam transition-colors">
                        <Globe className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-rp-subtle uppercase tracking-[0.2em] block mb-0.5">Workspace</label>
                        {isOwnProfile ? (
                            <EditableField
                                value={profile.website || ''}
                                onSave={(val) => handleUpdate('website', val)}
                                disabled={!isOwnProfile}
                                placeholder="https://yourmind.site"
                            />
                        ) : profile.website ? (
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rp-iris hover:underline truncate block px-3 py-1 text-sm font-medium"
                            >
                                {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                        ) : (
                            <span className="text-rp-subtle px-3 py-1 text-sm italic">Private HQ</span>
                        )}
                    </div>
                </div>

                {/* Join Date */}
                <div className="flex items-start gap-4 opacity-80">
                    <div className="p-2 bg-rp-base rounded-xl text-rp-muted">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-rp-muted uppercase tracking-[0.2em] block mb-0.5">Resident Since</label>
                        <div className="px-3 py-1 text-rp-text text-sm font-medium">
                            {new Date(profile.joinDate).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Social Links Integration */}
            {((profile.socialLinks && profile.socialLinks.length > 0) || isOwnProfile) && (
                <div className="pt-6 border-t border-rp-highlight-low">
                    <label className="text-[10px] font-bold text-rp-subtle uppercase tracking-[0.2em] block mb-4">Neural Connections</label>
                    {profile.socialLinks && profile.socialLinks.length > 0 ? (
                        <SocialLinksDisplay links={profile.socialLinks as any} />
                    ) : (
                        <div className="text-xs text-rp-muted italic">Connect your neural networks in settings</div>
                    )}
                </div>
            )}

            {/* Impact Stats */}
            <div className="pt-8 border-t border-rp-highlight-med space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-bold text-rp-subtle uppercase tracking-widest">Impact Core</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <StatsCard
                        icon={Users}
                        value={profile.stats.followers}
                        label="Followers"
                        variant="foam"
                    />
                    <StatsCard
                        icon={Users}
                        value={profile.stats.following}
                        label="Following"
                    />
                    <StatsCard
                        icon={MessageCircle}
                        value={profile.stats.posts}
                        label="Cortex"
                        variant="love"
                    />
                    <StatsCard
                        icon={Heart}
                        value={profile.stats.likes}
                        label="Sparks"
                        variant="gold"
                    />
                </div>
            </div>
        </div>
    );
}
