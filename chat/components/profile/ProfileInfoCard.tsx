'use client';

import { MapPin, Calendar, Globe, QrCode } from 'lucide-react';
import Image from 'next/image';
import { UserProfile } from '@/types/profile';
import { SocialLinksDisplay } from './SocialLinksDisplay';

interface ProfileInfoCardProps {
    profile: UserProfile;
    isOwnProfile?: boolean;
    onFollow?: () => void;
    onMessage?: () => void;
    onShowQR?: () => void;
}

export function ProfileInfoCard({
    profile,
    isOwnProfile,
    onFollow,
    onMessage,
    onShowQR
}: ProfileInfoCardProps) {
    return (
        <div className="bg-rose-pine-base rounded-lg shadow-lg p-8 -mt-20 relative z-10 border border-rose-pine-highlight">
            <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="relative w-[120px] h-[120px] rounded-full border-4 border-rose-pine-base shadow-xl flex-shrink-0">
                    {profile.hero_image_url ? (
                        <Image
                            src={profile.hero_image_url}
                            alt={profile.display_name || profile.username}
                            fill
                            className="rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-pine-love to-rose-pine-gold" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-rose-pine-text mb-1">
                        {profile.display_name || profile.username}
                    </h1>
                    {profile.display_name && (
                        <p className="text-rose-pine-subtle mb-3">@{profile.username}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 text-sm text-rose-pine-subtle mb-4">
                        {profile.location && (
                            <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{profile.location}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                        </div>
                        {profile.website_url && (
                            <a
                                href={profile.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-rose-pine-love transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                <span>Website</span>
                            </a>
                        )}
                    </div>

                    {/* Social Links */}
                    {profile.social_links && profile.social_links.length > 0 && (
                        <div className="mb-4">
                            <SocialLinksDisplay links={profile.social_links} />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {!isOwnProfile && (
                            <>
                                <button
                                    onClick={onFollow}
                                    className="px-6 py-2 bg-rose-pine-love text-white rounded hover:bg-rose-pine-love/90 transition-colors font-medium"
                                >
                                    Follow
                                </button>
                                <button
                                    onClick={onMessage}
                                    className="px-6 py-2 border-2 border-rose-pine-love text-rose-pine-love rounded hover:bg-rose-pine-love/10 transition-colors font-medium"
                                >
                                    Message
                                </button>
                            </>
                        )}
                        <button
                            onClick={onShowQR}
                            className="px-6 py-2 border-2 border-rose-pine-subtle text-rose-pine-text rounded hover:bg-rose-pine-overlay transition-colors font-medium flex items-center gap-2"
                        >
                            <QrCode className="w-4 h-4" />
                            QR Code
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
