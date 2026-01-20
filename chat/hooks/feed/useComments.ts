'use client';

import { useState, useCallback, useContext } from 'react';
import { PostComment } from '@/types/social';
import { toast } from 'sonner';
import { RemrinContext } from '@/context/context';

export function useComments(postId: string) {
    const { profile } = useContext(RemrinContext);
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();

            // Organize comments into a tree (up to 2 levels nesting)
            const roots = data.comments.filter((c: PostComment) => !c.parent_comment_id);
            const allReplies = data.comments.filter((c: PostComment) => c.parent_comment_id);

            const structured = roots.map((root: PostComment) => {
                const level1 = allReplies.filter((reply: PostComment) => reply.parent_comment_id === root.id);
                return {
                    ...root,
                    replies: level1.map((r1: PostComment) => ({
                        ...r1,
                        replies: allReplies.filter((reply: PostComment) => reply.parent_comment_id === r1.id)
                    }))
                };
            });

            setComments(structured);
        } catch (error: any) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    const addComment = async (content: string, parentCommentId?: string, mentionedUsers: string[] = []) => {
        const tempId = `temp-${Date.now()}`;
        const optimisticComment: PostComment = {
            id: tempId,
            post_id: postId,
            user_id: profile?.id || 'temp',
            content,
            parent_comment_id: parentCommentId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            author: {
                id: profile?.id || 'temp',
                username: profile?.username || 'me',
                display_name: profile?.display_name,
                avatar_url: profile?.hero_image_url
            },
            mentioned_users: [],
            likes_count: 0,
            user_liked: false,
            replies: [],
        };

        // Pre-update state optimistically
        if (!parentCommentId) {
            setComments(prev => [...prev, optimisticComment]);
        } else {
            setComments(prev => {
                return prev.map(c => {
                    if (c.id === parentCommentId) {
                        return { ...c, replies: [...(c.replies || []), optimisticComment] };
                    }
                    if (c.replies) {
                        return {
                            ...c,
                            replies: c.replies.map(r =>
                                r.id === parentCommentId
                                    ? { ...r, replies: [...(r.replies || []), optimisticComment] }
                                    : r
                            )
                        };
                    }
                    return c;
                });
            });
        }

        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    parent_comment_id: parentCommentId,
                    mentioned_users: mentionedUsers
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add comment');
            }

            const { comment } = await response.json();

            // Replace temp comment with real one
            const replaceTemp = (list: PostComment[]): PostComment[] => {
                return list.map(c => {
                    if (c.id === tempId) return { ...comment, replies: [] };
                    if (c.replies) return { ...c, replies: replaceTemp(c.replies) };
                    return c;
                });
            };
            setComments(prev => replaceTemp(prev));

            return comment;
        } catch (error: any) {
            // Revert optimistic update
            const removeTemp = (list: PostComment[]): PostComment[] => {
                return list.filter(c => c.id !== tempId).map(c => ({
                    ...c,
                    replies: c.replies ? removeTemp(c.replies) : []
                }));
            };
            setComments(prev => removeTemp(prev));
            toast.error(error.message || 'Error adding comment');
            throw error;
        }
    };

    const deleteComment = async (commentId: string) => {
        // Optimistic delete
        const oldComments = [...comments];
        const removeComment = (list: PostComment[]): PostComment[] => {
            return list.filter(c => c.id !== commentId).map(c => ({
                ...c,
                replies: c.replies ? removeComment(c.replies) : []
            }));
        };
        setComments(prev => removeComment(prev));

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete comment');
            toast.success('Comment deleted');
        } catch (error: any) {
            setComments(oldComments);
            toast.error(error.message || 'Error deleting comment');
        }
    };

    const toggleLike = async (commentId: string) => {
        // Find comment to flip status optimistically
        const updateLike = (list: PostComment[]): PostComment[] => {
            return list.map(c => {
                if (c.id === commentId) {
                    const isLiking = !c.user_liked;
                    return {
                        ...c,
                        user_liked: isLiking,
                        likes_count: (c.likes_count || 0) + (isLiking ? 1 : -1)
                    };
                }
                if (c.replies) {
                    return { ...c, replies: updateLike(c.replies) };
                }
                return c;
            });
        };

        const oldComments = [...comments];
        setComments(prev => updateLike(prev));

        try {
            const response = await fetch(`/api/comments/${commentId}/like`, {
                method: 'POST',
            });

            if (!response.ok) throw new Error('Failed to toggle like');
        } catch (error: any) {
            setComments(oldComments);
            toast.error(error.message || 'Error liking comment');
        }
    };

    return {
        comments,
        isLoading,
        fetchComments,
        addComment,
        deleteComment,
        toggleLike,
    };
}
