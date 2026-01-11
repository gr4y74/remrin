'use client';

import { useState, useCallback } from 'react';
import { PostComment } from '@/types/social';
import { toast } from 'sonner';

export function useComments(postId: string) {
    const [comments, setComments] = useState<PostComment[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchComments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}/comments`);
            if (!response.ok) throw new Error('Failed to fetch comments');
            const data = await response.json();

            // Organize comments into a tree (1 level nesting)
            const roots = data.comments.filter((c: PostComment) => !c.parent_comment_id);
            const replies = data.comments.filter((c: PostComment) => c.parent_comment_id);

            const structured = roots.map((root: PostComment) => ({
                ...root,
                replies: replies.filter((reply: PostComment) => reply.parent_comment_id === root.id)
            }));

            setComments(structured);
        } catch (error: any) {
            console.error('Error fetching comments:', error);
        } finally {
            setIsLoading(false);
        }
    }, [postId]);

    const addComment = async (content: string, parentCommentId?: string) => {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, parent_comment_id: parentCommentId }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add comment');
            }

            const { comment } = await response.json();

            // Update local state
            if (parentCommentId) {
                setComments(prev => prev.map(c =>
                    c.id === parentCommentId
                        ? { ...c, replies: [...(c.replies || []), comment] }
                        : c
                ));
            } else {
                setComments(prev => [...prev, { ...comment, replies: [] }]);
            }

            return comment;
        } catch (error: any) {
            toast.error(error.message || 'Error adding comment');
            throw error;
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Failed to delete comment');

            // Update local state
            setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
                ...c,
                replies: c.replies?.filter(r => r.id !== commentId)
            })));

            toast.success('Comment deleted');
        } catch (error: any) {
            toast.error(error.message || 'Error deleting comment');
        }
    };

    return {
        comments,
        isLoading,
        fetchComments,
        addComment,
        deleteComment,
    };
}
