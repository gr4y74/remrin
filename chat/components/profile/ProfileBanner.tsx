'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ProfileBannerProps {
    bannerUrl?: string;
    isOwnProfile?: boolean;
    onBannerUpdate?: (url: string) => void;
}

export function ProfileBanner({ bannerUrl, isOwnProfile, onBannerUpdate }: ProfileBannerProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [localUrl, setLocalUrl] = useState<string | undefined>(bannerUrl);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const ext = file.name.split('.').pop() || 'jpg';
            const path = `banners/${user.id}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(path);

            // Bust cache by appending timestamp
            const busstedUrl = `${publicUrl}?t=${Date.now()}`;
            setLocalUrl(busstedUrl);
            onBannerUpdate?.(busstedUrl);

            // Save to user profile
            await supabase
                .from('user_profiles')
                .update({ banner_url: publicUrl })
                .eq('user_id', user.id);

            toast.success('Banner updated!');
        } catch (err) {
            console.error('Banner upload failed:', err);
            toast.error('Failed to upload banner. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div
            className="relative h-[300px] w-full overflow-hidden bg-gradient-to-br from-rose-pine-love to-rose-pine-gold"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {localUrl && (
                <Image
                    src={localUrl}
                    alt="Profile banner"
                    fill
                    className="object-cover"
                    priority
                />
            )}

            {isOwnProfile && isHovering && !isUploading && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 transition-opacity">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <Upload className="h-8 w-8" />
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

            {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <div className="flex flex-col items-center gap-2 text-white">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        <span className="text-sm font-medium">Uploading…</span>
                    </div>
                </div>
            )}
        </div>
    );
}
