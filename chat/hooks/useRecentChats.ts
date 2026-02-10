"use client"

import { useCallback, useEffect, useState } from 'react'

interface RecentChatEntry {
    personaId: string
    personaName: string
    personaImage: string
    lastChatAt: string
    workspaceId: string
}

const MAX_RECENT_CHATS = 20

const RECENT_CHATS_EVENT = 'remrin-recent-chats-updated'

export function useRecentChats() {
    const [recentChats, setRecentChats] = useState<RecentChatEntry[]>([])

    // Load and listen for changes
    useEffect(() => {
        if (typeof window === 'undefined') return

        const loadChats = () => {
            try {
                const stored = localStorage.getItem('recentChats')
                if (stored) {
                    setRecentChats(JSON.parse(stored))
                } else {
                    setRecentChats([])
                }
            } catch (error) {
                console.error('Error loading recent chats:', error)
            }
        }

        // Initial load
        loadChats()

        // Handle custom event (same tab)
        const handleCustomEvent = () => loadChats()
        window.addEventListener(RECENT_CHATS_EVENT as any, handleCustomEvent)

        // Handle storage event (other tabs)
        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === 'recentChats') {
                loadChats()
            }
        }
        window.addEventListener('storage', handleStorageEvent)

        return () => {
            window.removeEventListener(RECENT_CHATS_EVENT as any, handleCustomEvent)
            window.removeEventListener('storage', handleStorageEvent)
        }
    }, [])

    const notifyUpdate = () => {
        window.dispatchEvent(new CustomEvent(RECENT_CHATS_EVENT))
    }

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
            let recentChatsData: RecentChatEntry[] = stored ? JSON.parse(stored) : []

            // Remove existing entry for this persona if it exists
            recentChatsData = recentChatsData.filter(chat => chat.personaId !== personaId)

            // Add new entry at the beginning
            recentChatsData.unshift({
                personaId,
                personaName,
                personaImage,
                lastChatAt: new Date().toISOString(),
                workspaceId
            })

            // Keep only the most recent MAX_RECENT_CHATS
            recentChatsData = recentChatsData.slice(0, MAX_RECENT_CHATS)

            // Save back to localStorage
            localStorage.setItem('recentChats', JSON.stringify(recentChatsData))
            notifyUpdate()
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
        notifyUpdate()
    }, [])

    /**
     * Remove a specific chat from recent chats
     */
    const removeChat = useCallback((personaId: string) => {
        if (typeof window === 'undefined') return

        try {
            const stored = localStorage.getItem('recentChats')
            if (!stored) return

            let recentChatsData: RecentChatEntry[] = JSON.parse(stored)
            recentChatsData = recentChatsData.filter(chat => chat.personaId !== personaId)
            localStorage.setItem('recentChats', JSON.stringify(recentChatsData))
            notifyUpdate()
        } catch (error) {
            console.error('Error removing recent chat:', error)
        }
    }, [])

    return {
        recentChats,
        trackChat,
        clearRecentChats,
        removeChat
    }
}
