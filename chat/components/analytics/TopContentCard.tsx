'use client';
import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react';

interface PostMetric {
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    thumbnail?: string;
}

interface TopContentCardProps {
    posts: PostMetric[];
}

export function TopContentCard({ posts }: TopContentCardProps) {
    return (
        <div className="bg-rp-surface rounded-lg p-6 border border-rp-highlight-med">
            <h3 className="text-lg font-semibold text-rp-text mb-4">Top Performing Content</h3>
            <div className="space-y-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="flex items-center gap-4 p-3 rounded-md hover:bg-rp-overlay transition-colors cursor-pointer group"
                    >
                        {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} className="w-12 h-12 rounded object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded bg-rp-highlight-low flex items-center justify-center text-rp-subtle">
                                <Eye size={20} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-rp-text font-medium truncate group-hover:text-rp-iris transition-colors">
                                {post.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1 text-xs text-rp-subtle">
                                    <Eye size={12} /> {post.views.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-rp-subtle">
                                    <Heart size={12} /> {post.likes.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-rp-subtle">
                                    <MessageCircle size={12} /> {post.comments.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-rp-subtle">
                                    <Share2 size={12} /> {post.shares.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
