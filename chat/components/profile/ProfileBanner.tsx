'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';

interface ProfileBannerProps {
    bannerUrl?: string;
    isOwnProfile?: boolean;
    onBannerUpdate?: (url: string) => void;
}

export function ProfileBanner({ bannerUrl, isOwnProfile, onBannerUpdate }: ProfileBannerProps) {
    const [isHovering, setIsHovering] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // TODO: Upload to Supabase storage
        // For now, create object URL
        const url = URL.createObjectURL(file);
        onBannerUpdate?.(url);
    };

    return (
        <div
            className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-rose-pine-love to-rose-pine-gold"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
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

            {isOwnProfile && isHovering && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer transition-opacity">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <Upload className="w-8 h-8" />
                        <span className="text-sm font-medium">Upload Banner</span>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </label>
            )}
        </div>
    );
}
