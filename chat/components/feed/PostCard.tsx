'use client';

import { useState } from 'react';
import { Post, ReactionType } from '@/types/social';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import {
    Heart,
    MessageCircle,
    Share2,
    MoreHorizontal,
    Trash2,
    Edit2,
    Lock,
    Users,
    Globe
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReactionPicker } from './ReactionPicker';
import { usePost } from '@/hooks/feed/usePost';
import { getUserAvatarUrl, getUserDisplayName, getUserProfileUrl } from '@/lib/user-profile-utils';
import Link from 'next/link';

interface PostCardProps {
    post: Post;
    isOwner?: boolean;
    onDelete?: (postId: string) => void;
    onEdit?: (post: Post) => void;
}

export function PostCard({ post, isOwner, onDelete, onEdit }: PostCardProps) {
    const { reactToPost } = usePost();
    const [localReaction, setLocalReaction] = useState<ReactionType | null>(post.user_reaction || null);
    const [reactionsCount, setReactionsCount] = useState(post.reactions_count || 0);
    const [showComments, setShowComments] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleReact = async (type: ReactionType) => {
        // Optimistic update
        const prevReaction = localReaction;
        const prevCount = reactionsCount;

        if (localReaction === type) {
            setLocalReaction(null);
            setReactionsCount(prev => prev - 1);
        } else {
            setLocalReaction(type);
            setReactionsCount(prev => prev + (prevReaction ? 0 : 1));
        }

        try {
            await reactToPost(post.id, type);
        } catch (error) {
            // Rollback on error
            setLocalReaction(prevReaction);
            setReactionsCount(prevCount);
        }
    };

    const getVisibilityIcon = () => {
        switch (post.visibility) {
            case 'private': return <Lock className="w-3 h-3" />;
            case 'followers': return <Users className="w-3 h-3" />;
            default: return <Globe className="w-3 h-3" />;
        }
    };

    return (
        <>
            <div className="bg-rp-surface rounded-xl p-4 hover:bg-rp-overlay/50 transition-all group animate-fadeIn">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link href={getUserProfileUrl(post.author?.username || '')}>
                            <Avatar className="w-10 h-10 border border-rp-highlight-low hover:border-rp-rose transition-colors cursor-pointer">
                                <AvatarImage src={getUserAvatarUrl(post.author)} />
                                <AvatarFallback className="bg-rp-overlay text-rp-text">
                                    {getUserDisplayName(post.author).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Link href={getUserProfileUrl(post.author?.username || '')}>
                                    <span className="font-bold text-rp-text hover:text-rp-rose cursor-pointer transition-colors">
                                        {getUserDisplayName(post.author)}
                                    </span>
                                </Link>
                                <span className="text-sm text-rp-muted">
                                    @{post.author?.username}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-rp-subtle">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                <span className="w-1 h-1 rounded-full bg-rp-muted" />
                                <span className="flex items-center gap-1">
                                    {getVisibilityIcon()}
                                    {post.visibility}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-rp-subtle hover:text-rp-text rounded-full">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-rp-overlay border-rp-highlight-low">
                            {isOwner && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => onEdit?.(post)}
                                        className="text-rp-foam focus:text-rp-foam focus:bg-rp-highlight-low flex gap-2 cursor-pointer"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit Post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDelete?.(post.id)}
                                        className="text-rp-love focus:text-rp-love focus:bg-rp-highlight-low flex gap-2 cursor-pointer"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Post
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuItem className="text-rp-text hover:bg-rp-highlight-low flex gap-2 cursor-pointer">
                                Report Post
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Content */}
                <div className="mb-4 text-rp-text leading-relaxed whitespace-pre-wrap">
                    {post.content}
                </div>

                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                    <div className={`grid gap-2 mb-4 rounded-xl overflow-hidden ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                        }`}>
                        {post.media_urls.map((url, i) => (
                            <div
                                key={i}
                                className="relative aspect-video bg-rp-overlay group/media overflow-hidden cursor-pointer"
                                onClick={() => setSelectedImage(url)}
                            >
                                <Image
                                    src={url}
                                    alt={`Post media ${i + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover/media:scale-105"
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/10 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover/media:opacity-100 transition-opacity bg-rp-base/80 rounded-full p-2">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1">
                        <ReactionPicker onSelect={handleReact}>
                            <button
                                className={`flex items-center gap-2 py-2 px-3 rounded-full transition-all ${localReaction
                                    ? 'bg-rp-highlight-low text-rp-rose'
                                    : 'text-rp-subtle hover:bg-rp-highlight-low hover:text-rp-text'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${localReaction ? 'fill-current' : ''}`} />
                                <span className="font-medium text-sm">{reactionsCount}</span>
                            </button>
                        </ReactionPicker>

                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 py-2 px-3 rounded-full text-rp-subtle hover:bg-rp-highlight-low hover:text-rp-iris transition-all"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="font-medium text-sm">{post.comments_count || 0}</span>
                        </button>
                    </div>

                    <button className="p-2 rounded-full text-rp-subtle hover:bg-rp-highlight-low hover:text-rp-foam transition-all">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Comments Placeholder */}
                {showComments && (
                    <div className="mt-4 pt-4 border-t border-rp-highlight-low animate-fadeIn">
                        <p className="text-center text-sm text-rp-muted">Comments section coming soon...</p>
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-rp-surface/80 hover:bg-rp-surface text-rp-text transition-colors z-10"
                        aria-label="Close image"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
                        <Image
                            src={selectedImage}
                            alt="Full size image"
                            fill
                            className="object-contain"
                            sizes="100vw"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
