'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import { FollowButton } from '@/components/profile/FollowButton';
import { Skeleton } from '@/components/ui/skeleton';

interface SuggestedUser {
    user_id: string;
    username: string;
    display_name: string;
    hero_image_url: string | null;
    bio: string | null;
    follower_count: number;
}

export function SuggestedUsers() {
    const [users, setUsers] = useState<SuggestedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSuggested = async () => {
        try {
            const response = await fetch('/api/users/suggested');
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching suggested users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuggested();
    }, []);

    if (isLoading) {
        return (
            <div className="bg-rp-surface rounded-3xl p-6 border border-rp-highlight-low">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="w-5 h-5 rounded bg-rp-overlay" />
                    <Skeleton className="h-5 w-32 bg-rp-overlay" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full bg-rp-overlay" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-24 bg-rp-overlay" />
                                <Skeleton className="h-3 w-16 bg-rp-overlay" />
                            </div>
                            <Skeleton className="h-8 w-16 rounded-full bg-rp-overlay" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-rp-surface rounded-3xl p-6 border border-rp-highlight-low shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-rp-text flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-rp-iris" />
                        Souls to Follow
                    </h3>
                </div>
                <p className="text-sm text-rp-muted text-center py-4">
                    No suggestions available yet. Check back soon!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-rp-surface rounded-3xl p-6 border border-rp-highlight-low shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-rp-text flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rp-iris" />
                    Souls to Follow
                </h3>
                <span className="text-[10px] font-bold text-rp-subtle uppercase tracking-widest">Suggested</span>
            </div>

            <div className="space-y-5">
                {users.map((user) => (
                    <div key={user.user_id} className="flex items-center gap-3 group">
                        <Link href={`/profile/${user.username}`} className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-rp-overlay border border-rp-highlight-low group-hover:border-rp-iris transition-colors">
                                {user.hero_image_url ? (
                                    <Image
                                        src={user.hero_image_url}
                                        alt={user.display_name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-rp-subtle font-bold">
                                        {user.display_name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${user.username}`} className="block">
                                <p className="text-sm font-bold text-rp-text truncate hover:text-rp-iris transition-colors">
                                    {user.display_name}
                                </p>
                                <p className="text-xs text-rp-subtle truncate">@{user.username}</p>
                            </Link>
                            <p className="text-[10px] text-rp-muted mt-0.5 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {user.follower_count} followers
                            </p>
                        </div>

                        <FollowButton
                            userId={user.user_id}
                            compact
                            className="scale-90"
                            onFollowChange={(isFollowing) => {
                                // Optional: remove user from suggestions if followed
                                if (isFollowing) {
                                    setTimeout(() => {
                                        setUsers(prev => prev.filter(u => u.user_id !== user.user_id));
                                    }, 1000);
                                }
                            }}
                        />
                    </div>
                ))}
            </div>

            <Link
                href="/social"
                className="mt-6 block text-center text-xs font-bold text-rp-iris hover:text-rp-love transition-colors pt-4 border-t border-rp-highlight-low"
            >
                View all residents
            </Link>
        </div>
    );
}
