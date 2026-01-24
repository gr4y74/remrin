'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { debounce } from 'lodash';

export interface ConversationState {
    id: string;
    user_id: string;
    conversation_id: string;
    conversation_type: 'direct' | 'room';
    last_read_message_id?: string;
    last_read_at?: string;
    draft_message?: string;
    scroll_position: number;
    is_pinned: boolean;
    is_archived: boolean;
    last_activity_at: string;
    created_at: string;
    updated_at: string;
}

interface UseConversationStateReturn {
    state: ConversationState | null;
    isLoading: boolean;
    updateDraft: (draft: string) => Promise<void>;
    updateScrollPosition: (position: number) => void;
    markAsRead: (messageId: string) => Promise<void>;
    togglePin: () => Promise<void>;
    toggleArchive: () => Promise<void>;
    clearDraft: () => Promise<void>;
}

/**
 * Hook to manage conversation state with real-time sync across devices
 * Handles draft messages, scroll position, read receipts, and more
 */
export function useConversationState(
    userId: string | undefined,
    conversationId: string | undefined,
    conversationType: 'direct' | 'room' = 'direct'
): UseConversationStateReturn {
    const [state, setState] = useState<ConversationState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = useMemo(() => createClient(), []);

    // Load initial state from database
    const loadState = useCallback(async () => {
        if (!userId || !conversationId) {
            setIsLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('conversation_state')
                .select('*')
                .eq('user_id', userId)
                .eq('conversation_id', conversationId)
                .eq('conversation_type', conversationType)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                console.error('[ConversationState] Error loading state:', error);
            }

            setState(data || null);
        } catch (error) {
            console.error('[ConversationState] Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, conversationId, conversationType, supabase]);

    // Load state on mount
    useEffect(() => {
        loadState();
    }, [loadState]);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!userId || !conversationId) return;

        const channel = supabase
            .channel(`conversation_state:${userId}:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversation_state',
                    filter: `user_id=eq.${userId},conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    console.log('[ConversationState] Real-time update:', payload);
                    if (payload.eventType === 'DELETE') {
                        setState(null);
                    } else {
                        setState(payload.new as ConversationState);
                    }
                }
            )
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [userId, conversationId, supabase]);

    // Update state in database
    const updateState = useCallback(async (updates: Partial<ConversationState>) => {
        if (!userId || !conversationId) return;

        // Optimistic update
        setState(prev => prev ? { ...prev, ...updates } as ConversationState : null);

        try {
            const { error } = await supabase
                .from('conversation_state')
                .upsert({
                    user_id: userId,
                    conversation_id: conversationId,
                    conversation_type: conversationType,
                    ...updates,
                    last_activity_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,conversation_id,conversation_type'
                });

            if (error) {
                console.error('[ConversationState] Error updating state:', error);
                // Revert optimistic update
                await loadState();
            }
        } catch (error) {
            console.error('[ConversationState] Error:', error);
            await loadState();
        }
    }, [userId, conversationId, conversationType, supabase, loadState]);

    // Debounced draft update (500ms delay)
    const updateDraft = useCallback(
        debounce(async (draft: string) => {
            await updateState({ draft_message: draft });
        }, 500),
        [updateState]
    );

    // Debounced scroll position update (300ms delay)
    const updateScrollPosition = useCallback(
        debounce((position: number) => {
            updateState({ scroll_position: position });
        }, 300),
        [updateState]
    );

    // Mark message as read
    const markAsRead = useCallback(async (messageId: string) => {
        if (!userId) return;

        try {
            const { error } = await supabase.rpc('mark_message_read', {
                p_message_id: messageId,
                p_user_id: userId
            });

            if (error) {
                console.error('[ConversationState] Error marking as read:', error);
            }
        } catch (error) {
            console.error('[ConversationState] Error:', error);
        }
    }, [userId, supabase]);

    // Toggle pin status
    const togglePin = useCallback(async () => {
        await updateState({ is_pinned: !state?.is_pinned });
    }, [state?.is_pinned, updateState]);

    // Toggle archive status
    const toggleArchive = useCallback(async () => {
        await updateState({ is_archived: !state?.is_archived });
    }, [state?.is_archived, updateState]);

    // Clear draft message
    const clearDraft = useCallback(async () => {
        await updateState({ draft_message: '' });
    }, [updateState]);

    return {
        state,
        isLoading,
        updateDraft,
        updateScrollPosition,
        markAsRead,
        togglePin,
        toggleArchive,
        clearDraft
    };
}
