'use client';

import { useState, useEffect, useCallback } from 'react';
import { Post } from '@/types/social';
import { toast } from 'sonner';

interface UseFeedOptions {
    profileId?: string;
    limit?: number;
}

export function useFeed(options: UseFeedOptions = {}) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);

    const fetchPosts = useCallback(async (isInitial = false) => {
        if (isLoading || (!hasMore && !isInitial)) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: (options.limit || 20).toString(),
            });

            if (options.profileId) params.append('profileId', options.profileId);
            if (!isInitial && cursor) params.append('cursor', cursor);

            const response = await fetch(`/api/posts?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch posts');

            const data = await response.json();

            if (isInitial) {
                setPosts(data.posts);
            } else {
                setPosts(prev => [...prev, ...data.posts]);
            }

            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
        } catch (error: any) {
            console.error('Error fetching feed:', error);
            toast.error('Could not load feed');
        } finally {
            setIsLoading(false);
        }
    }, [cursor, hasMore, isLoading, options.limit, options.profileId]);

    useEffect(() => {
        fetchPosts(true);
    }, [options.profileId]);

    const refresh = useCallback(() => fetchPosts(true), [fetchPosts]);
    const loadMore = useCallback(() => fetchPosts(false), [fetchPosts]);

    return {
        posts,
        isLoading,
        hasMore,
        refresh,
        loadMore,
        setPosts, // Useful for optimistic updates
    };
}
