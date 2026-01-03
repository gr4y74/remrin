/**
 * useRecentChats - Hook to track and manage recent chat sessions
 */

"use client"

import { useCallback } from 'react'

interface RecentChatEntry {
    personaId: string
    personaName: string
    personaImage: string
    lastChatAt: string
    workspaceId: string
}

const MAX_RECENT_CHATS = 20

export function useRecentChats() {
    /**
     * Add or update a chat in the recent chats list
     */
    const trackChat = useCallback((
        personaId: string,
        personaName: string,
        personaImage: string,
        workspaceId: string
    ) => {
        if (typeof window === 'undefined') return

        try {
            // Get existing chats
            const stored = localStorage.getItem('recentChats')
            let recentChats: RecentChatEntry[] = stored ? JSON.parse(stored) : []

            // Remove existing entry for this persona if it exists
            recentChats = recentChats.filter(chat => chat.personaId !== personaId)

            // Add new entry at the beginning
            recentChats.unshift({
                personaId,
                personaName,
                personaImage,
                lastChatAt: new Date().toISOString(),
                workspaceId
            })

            // Keep only the most recent MAX_RECENT_CHATS
            recentChats = recentChats.slice(0, MAX_RECENT_CHATS)

            // Save back to localStorage
            localStorage.setItem('recentChats', JSON.stringify(recentChats))
        } catch (error) {
            console.error('Error tracking recent chat:', error)
        }
    }, [])

    /**
     * Clear all recent chats
     */
    const clearRecentChats = useCallback(() => {
        if (typeof window === 'undefined') return
        localStorage.removeItem('recentChats')
    }, [])

    /**
     * Remove a specific chat from recent chats
     */
    const removeChat = useCallback((personaId: string) => {
        if (typeof window === 'undefined') return

        try {
            const stored = localStorage.getItem('recentChats')
            if (!stored) return

            let recentChats: RecentChatEntry[] = JSON.parse(stored)
            recentChats = recentChats.filter(chat => chat.personaId !== personaId)
            localStorage.setItem('recentChats', JSON.stringify(recentChats))
        } catch (error) {
            console.error('Error removing recent chat:', error)
        }
    }, [])

    return {
        trackChat,
        clearRecentChats,
        removeChat
    }
}
