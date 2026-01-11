'use client';

import { useState, useRef, useEffect } from 'react';
import { useFeed } from '@/hooks/feed/useFeed';
import { PostCard } from './PostCard';
import { CreatePostModal } from './CreatePostModal';
import { Post } from '@/types/social';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCcw, Filter, TrendingUp, Clock, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

export function FeedContainer() {
    const { posts, isLoading, hasMore, loadMore, refresh, setPosts } = useFeed();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'following' | 'trending'>('all');
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, loadMore]);

    const handlePostSuccess = (newPost: Post) => {
        setPosts(prev => [newPost, ...prev]);
    };

    const handleDeletePost = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {/* Feed Header / Actions */}
            <div className="flex items-center justify-between sticky top-[64px] z-10 bg-rp-base/80 backdrop-blur-md py-2 -mx-4 px-4 border-b border-rp-highlight-low mb-6">
                <div className="flex gap-2">
                    <FilterButton
                        active={filter === 'all'}
                        onClick={() => setFilter('all')}
                        icon={Clock}
                        label="Latest"
                    />
                    <FilterButton
                        active={filter === 'following'}
                        onClick={() => setFilter('following')}
                        icon={Users}
                        label="Following"
                    />
                    <FilterButton
                        active={filter === 'trending'}
                        onClick={() => setFilter('trending')}
                        icon={TrendingUp}
                        label="Trending"
                    />
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={refresh}
                        className="text-rp-subtle hover:text-rp-foam rounded-full h-9 w-9"
                        disabled={isLoading}
                    >
                        <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-rp-rose hover:bg-rp-rose/90 text-white rounded-full h-9 px-4 font-bold flex gap-2 shadow-lg shadow-rp-rose/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Post</span>
                    </Button>
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {posts.map((post) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PostCard
                                post={post}
                                isOwner={true} // In a real app check if current user matches post user_id
                                onDelete={handleDeletePost}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading State */}
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-rp-surface rounded-xl p-4 border border-rp-highlight-low space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full bg-rp-overlay" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32 bg-rp-overlay" />
                                        <Skeleton className="h-3 w-20 bg-rp-overlay" />
                                    </div>
                                </div>
                                <Skeleton className="h-20 w-full bg-rp-overlay" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-8 w-16 rounded-full bg-rp-overlay" />
                                    <Skeleton className="h-8 w-16 rounded-full bg-rp-overlay" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && posts.length === 0 && (
                    <div className="text-center py-20 px-4 bg-rp-surface rounded-3xl border border-rp-highlight-low/50 border-dashed">
                        <div className="w-20 h-20 bg-rp-overlay/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-10 h-10 text-rp-muted" />
                        </div>
                        <h3 className="text-xl font-bold text-rp-text mb-2">The Silence of the Souls</h3>
                        <p className="text-rp-muted max-w-sm mx-auto mb-6">
                            No posts found. Start your journey by sharing your first soul moment with the community.
                        </p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-rp-rose hover:bg-rp-rose/90 text-white rounded-full px-8 font-bold"
                        >
                            Create First Post
                        </Button>
                    </div>
                )}

                {/* Infinite Scroll Trigger */}
                <div ref={loadMoreRef} className="h-10 w-full flex items-center justify-center">
                    {hasMore && !isLoading && <div className="w-2 h-2 rounded-full bg-rp-muted animate-pulse" />}
                </div>
            </div>

            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handlePostSuccess}
            />
        </div>
    );
}

function FilterButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active
                    ? 'bg-rp-rose text-white shadow-md'
                    : 'text-rp-subtle hover:bg-rp-highlight-low hover:text-rp-text'
                }`}
        >
            <Icon className="w-4 h-4" />
            {label}
        </button>
    );
}
