'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Post } from '@/types/social';
import { toast } from 'sonner';

export type FeedFilter = 'all' | 'following' | 'trending';

interface UseFeedOptions {
    profileId?: string;
    limit?: number;
    filter?: FeedFilter;
}

export function useFeed(options: UseFeedOptions = {}) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);
    const optionsRef = useRef(options);

    // Update ref when options change
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    const fetchPosts = useCallback(async (isInitial = false) => {
        // Prevent concurrent fetches or fetching when no more data
        if (isLoading || (!hasMore && !isInitial)) return;

        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: (optionsRef.current.limit || 20).toString(),
            });

            if (optionsRef.current.profileId) params.append('profileId', optionsRef.current.profileId);
            if (optionsRef.current.filter && optionsRef.current.filter !== 'all') {
                params.append('filter', optionsRef.current.filter);
            }

            const currentCursor = isInitial ? null : cursor;
            if (currentCursor) params.append('cursor', currentCursor);

            const response = await fetch(`/api/posts?${params.toString()}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch posts');
            }

            const data = await response.json();

            if (isInitial) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }

            setCursor(data.nextCursor);
            setHasMore(!!data.nextCursor);
        } catch (error: any) {
            console.error('Error fetching feed:', error);
            toast.error(error.message || 'Could not load feed');
            // Crucial: Stop trying to load more if we hit an error to prevent infinite loops
            if (!isInitial) setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [cursor, hasMore, isLoading]);

    // Reset and refetch when filter or profile changes
    useEffect(() => {
        setCursor(null);
        setHasMore(true);
        setPosts([]);
        fetchPosts(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.profileId, options.filter]);

    const refresh = useCallback(() => {
        setCursor(null);
        setHasMore(true);
        fetchPosts(true);
    }, [fetchPosts]);

    const loadMore = useCallback(() => fetchPosts(false), [fetchPosts]);

    return {
        posts,
        isLoading,
        hasMore,
        refresh,
        loadMore,
        setPosts,
    };
}
