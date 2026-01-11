'use client';

import { useState } from 'react';
import { Upload, Camera } from 'lucide-react';
import Image from 'next/image';

/**
 * Props for the ProfileHeader component
 */
interface ProfileHeaderProps {
    /** Banner image URL */
    bannerUrl?: string;
    /** Avatar image URL */
    avatarUrl?: string;
    /** User's display name */
    displayName: string;
    /** Username */
    username: string;
    /** Whether this is the user's own profile */
    isOwnProfile?: boolean;
    /** Callback when banner is updated */
    onBannerUpdate?: (file: File) => void;
    /** Callback when avatar is updated */
    onAvatarUpdate?: (file: File) => void;
    /** Action buttons (Follow, Message, etc.) */
    actions?: React.ReactNode;
}

/**
 * ProfileHeader - Large banner with avatar overlay and edit capabilities
 * 
 * @example
 * ```tsx
 * <ProfileHeader 
 *   bannerUrl="/banner.jpg"
 *   avatarUrl="/avatar.jpg"
 *   displayName="John Doe"
 *   username="johndoe"
 *   isOwnProfile={true}
 *   onBannerUpdate={(file) => {}}
 *   onAvatarUpdate={(file) => {}}
 * />
 * ```
 */
export function ProfileHeader({
    bannerUrl,
    avatarUrl,
    displayName,
    username,
    isOwnProfile = false,
    onBannerUpdate,
    onAvatarUpdate,
    actions,
}: ProfileHeaderProps) {
    const [isBannerHovering, setIsBannerHovering] = useState(false);
    const [isAvatarHovering, setIsAvatarHovering] = useState(false);

    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onBannerUpdate) {
            onBannerUpdate(file);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && onAvatarUpdate) {
            onAvatarUpdate(file);
        }
    };

    return (
        <div className="relative">
            {/* Banner */}
            <div
                className="relative h-[300px] md:h-[400px] w-full overflow-hidden bg-gradient-to-br from-rp-love via-rp-iris to-rp-foam"
                onMouseEnter={() => setIsBannerHovering(true)}
                onMouseLeave={() => setIsBannerHovering(false)}
            >
                {bannerUrl && (
                    <Image
                        src={bannerUrl}
                        alt="Profile banner"
                        fill
                        className="object-cover"
                        priority
                    />
                )}

                {/* Banner Edit Overlay */}
                {isOwnProfile && isBannerHovering && (
                    <label
                        className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer transition-all duration-300 backdrop-blur-sm"
                        htmlFor="banner-upload"
                    >
                        <div className="flex flex-col items-center gap-3 text-white transform hover:scale-105 transition-transform">
                            <Upload className="w-10 h-10" aria-hidden="true" />
                            <span className="text-lg font-semibold">Upload Banner</span>
                            <span className="text-sm text-white/80">Recommended: 1500x500px</span>
                        </div>
                        <input
                            id="banner-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerUpload}
                            aria-label="Upload banner image"
                        />
                    </label>
                )}
            </div>

            {/* Avatar & Info Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-24 md:-mt-32 pb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
                        {/* Avatar */}
                        <div
                            className="relative group"
                            onMouseEnter={() => setIsAvatarHovering(true)}
                            onMouseLeave={() => setIsAvatarHovering(false)}
                        >
                            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-rp-base shadow-2xl overflow-hidden bg-gradient-to-br from-rp-love to-rp-gold">
                                {avatarUrl ? (
                                    <Image
                                        src={avatarUrl}
                                        alt={displayName}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-4xl md:text-5xl font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Avatar Edit Overlay */}
                                {isOwnProfile && isAvatarHovering && (
                                    <label
                                        className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer transition-all duration-300"
                                        htmlFor="avatar-upload"
                                    >
                                        <Camera className="w-8 h-8 text-white" aria-hidden="true" />
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                            aria-label="Upload avatar image"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Name & Actions */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-2">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-rp-text mb-1">
                                    {displayName}
                                </h1>
                                <p className="text-lg text-rp-subtle">@{username}</p>
                            </div>

                            {/* Action Buttons */}
                            {actions && (
                                <div className="flex gap-3">
                                    {actions}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
