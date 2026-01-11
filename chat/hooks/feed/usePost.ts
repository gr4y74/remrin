'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/browser-client';
import { Post, ReactionType } from '@/types/social';
import { toast } from 'sonner';

export function usePost() {
    const [isLoading, setIsLoading] = useState(false);

    const uploadImages = async (files: File[]): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of files) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Unauthorized');

            const filePath = `${user.id}/${Date.now()}_${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from('post-media')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('post-media')
                .getPublicUrl(filePath);

            urls.push(publicUrl);
        }

        return urls;
    };

    const createPost = async (data: {
        content: string;
        media_files?: File[];
        post_type?: Post['post_type'];
        visibility?: Post['visibility'];
        persona_id?: string;
        achievement_id?: string;
    }) => {
        setIsLoading(true);
        try {
            let media_urls: string[] = [];
            if (data.media_files && data.media_files.length > 0) {
                media_urls = await uploadImages(data.media_files);
            }

            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: data.content,
                    media_urls,
                    post_type: data.post_type || 'text',
                    visibility: data.visibility || 'public',
                    persona_id: data.persona_id,
                    achievement_id: data.achievement_id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create post');
            }

            const result = await response.json();
            toast.success('Post created successfully!');
            return result.post;
        } catch (error: any) {
            toast.error(error.message || 'Error creating post');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const editPost = async (postId: string, data: {
        content: string;
        visibility?: Post['visibility'];
    }) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to update post');
            }

            const result = await response.json();
            toast.success('Post updated!');
            return result.post;
        } catch (error: any) {
            toast.error(error.message || 'Error updating post');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const deletePost = async (postId: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            toast.success('Post deleted');
            return true;
        } catch (error: any) {
            toast.error(error.message || 'Error deleting post');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const reactToPost = async (postId: string, reactionType: ReactionType) => {
        try {
            const response = await fetch(`/api/posts/${postId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reaction_type: reactionType }),
            });

            if (!response.ok) {
                throw new Error('Failed to react to post');
            }

            return await response.json();
        } catch (error: any) {
            toast.error(error.message || 'Error reacting to post');
            throw error;
        }
    };

    return {
        isLoading,
        createPost,
        editPost,
        deletePost,
        reactToPost,
    };
}
