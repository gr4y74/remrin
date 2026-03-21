"use client"

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
    useMemo,
    ReactNode
} from 'react'
import { ChatMessageContent, ProviderId, UserTier } from '@/lib/chat-engine/types'
import { useAuth } from '@/hooks/useAuth'
import { useUnifiedProfile } from '@/hooks/useUnifiedProfile'
import { supabase } from '@/lib/supabase/browser-client'
import { getRecoveredToken } from '@/lib/supabase/token-recovery'

export interface Bookmark {
    id: string
    user_id: string
    chat_id: string
    message_id: string
    folder_id?: string
    content_preview?: string
    note?: string
    created_at: string
}

interface ChatSoloEngineState {
    messages: ChatMessageContent[]
    isGenerating: boolean
    currentProvider: ProviderId | null
    userTier: UserTier
    error: string | null
    personaId: string
    isLoadingHistory: boolean
    llmProvider: string | null
    llmModel: string | null
    activeArtifact: string | null
    showThinking: boolean
    currentThreadName: string
    currentChatId: string | null
    threads: any[]
    bookmarks: Bookmark[]
}

interface ChatSoloEngineActions {
    sendMessage: (content: string, skipUserMessage?: boolean) => Promise<void>
    stopGeneration: () => void
    clearMessages: () => void
    setLLMConfig: (provider: string | null, model: string | null) => void
    toggleThinking: () => void
    toggleStar: (chatId: string, isStarred: boolean) => Promise<void>
    renameChat: (chatId: string, newTitle: string) => Promise<void>
    createNewChat: () => void
    setCurrentThreadName: (name: string) => void
    switchThread: (name: string) => void
    toggleBookmark: (message: ChatMessageContent) => Promise<void>
    saveFeedback: (messageId: string, feedback: 'like' | 'dislike' | null) => Promise<void>
    regenerateMessage: (messageId: string) => Promise<void>
}

interface ChatSoloEngineContextValue extends ChatSoloEngineState, ChatSoloEngineActions { }

const ChatSoloEngineContext = createContext<ChatSoloEngineContextValue | null>(null)

interface ChatSoloEngineProviderProps {
    children: ReactNode
    personaId: string
    personaIntroMessage?: string
    userTier?: UserTier
}

export function ChatSoloEngineProvider({
    children,
    personaId,
    personaIntroMessage,
    userTier = 'pro' // Defaulting Solo to Pro-tier vibes
}: ChatSoloEngineProviderProps) {
    const [messages, setMessages] = useState<ChatMessageContent[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentProvider, setCurrentProvider] = useState<ProviderId | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [currentThreadName, setCurrentThreadName] = useState('solo-cockpit-v1')
    const [threads, setThreads] = useState<any[]>([])
    const [llmProvider, setLLMProvider] = useState<string | null>('deepseek')
    const [llmModel, setLLMModel] = useState<string | null>('deepseek-chat')
    const [activeArtifact, setActiveArtifact] = useState<string | null>(null)
    const [showThinking, setShowThinking] = useState(false)
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)

    const { user, session } = useAuth()
    const { profile, updateProfile } = useUnifiedProfile(user?.id)

    // Sync showThinking with profile
    useEffect(() => {
        if (profile) {
            setShowThinking(profile.enable_thinking ?? false)
        }
    }, [profile])

    const toggleThinking = useCallback(async () => {
        const newValue = !showThinking
        setShowThinking(newValue)
        if (user?.id) {
            await updateProfile({ enable_thinking: newValue })
        }
    }, [showThinking, user?.id, updateProfile])

    const abortControllerRef = useRef<AbortController | null>(null)
    const messagesRef = useRef<ChatMessageContent[]>([])

    const stopGeneration = useCallback(() => {
        abortControllerRef.current?.abort()
    }, [])

    // Log auth changes
    useEffect(() => {
    }, [user, session])

    useEffect(() => {
        const hasLink = !!session?.access_token || !!getRecoveredToken()
    }, [session])

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    /**
     * Load Solo History
     */
    useEffect(() => {
        let isCurrent = true // Protection against race conditions

        const fetchSoloHistory = async () => {
            if (!isCurrent) return
            if (!user) {
                console.warn('🕵️ [ChatSoloEngine] No user for history fetch.')
                return
            }

            setIsLoadingHistory(true)
            const targetName = currentThreadName // Capture target

            try {
                const token = session?.access_token || getRecoveredToken()
                if (!token) console.warn('🕵️ [ChatSoloEngine] No auth token available for history fetch.')

                const response = await fetch(`/api/v2/chat/history?personaId=${personaId}&customName=${targetName}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    credentials: 'include'
                })

                if (!isCurrent) {
                    return
                }

                if (response.ok) {
                    const history = await response.json()

                    if (!isCurrent) return

                    if (history && history.length > 0) {
                        setMessages(history.map((msg: any) => ({
                            id: msg.id,
                            role: msg.role,
                            content: msg.content,
                            timestamp: new Date(msg.timestamp)
                        })))
                    } else {
                        if (personaIntroMessage) {
                            setMessages([{
                                role: 'assistant',
                                content: personaIntroMessage,
                                timestamp: new Date()
                            }])
                        } else {
                            setMessages([])
                        }
                    }
                } else {
                    console.error(`❌ [ChatSoloEngine] History fetch failed for ${targetName}: ${response.status}`)
                    if (isCurrent) {
                        setError(`Failed to load history: ${response.status}`)
                    }
                }
            } catch (e) {
                console.error(`❌ [ChatSoloEngine] History fetch failed for ${targetName}:`, e)
            } finally {
                if (isCurrent) setIsLoadingHistory(false)
            }
        }

        fetchSoloHistory()

        return () => {
            isCurrent = false // Cleanup on change
        }
    }, [personaId, personaIntroMessage, user, session, currentThreadName])

    /**
     * Fetch Threads List
     */
    useEffect(() => {
        const fetchThreads = async () => {
            if (!user) return
            try {
                // First, try to get threads with message counts
                const { data, error } = await supabase
                    .from('chats')
                    .select('id, name, title, is_starred, created_at, updated_at')
                    .eq('user_id', user.id)
                    .or(`name.ilike.persona-chat-${personaId}%,name.ilike.solo-cockpit-%`)
                    .order('updated_at', { ascending: false })

                if (error) {
                    // Fallback for missing columns
                    console.warn('⚠️ [ChatSoloEngine] Advanced threads fetch failed, falling back to basic...', error.message)
                    const { data: basicData } = await supabase
                        .from('chats')
                        .select('id, name, created_at, updated_at')
                        .eq('user_id', user.id)
                        .or(`name.ilike.persona-chat-${personaId}%,name.ilike.solo-cockpit-%`)
                        .order('updated_at', { ascending: false })

                    if (basicData) {
                        // Get message counts for each chat
                        const threadsWithCounts = await Promise.all(
                            basicData.map(async (chat) => {
                                const { count } = await supabase
                                    .from('messages')
                                    .select('*', { count: 'exact', head: true })
                                    .eq('chat_id', chat.id)

                                return { ...chat, title: null, is_starred: false, message_count: count || 0 }
                            })
                        )

                        // Filter out empty chats and sort by message count
                        const nonEmptyChats = threadsWithCounts
                            .filter((t: any) => t.message_count > 0)
                            .sort((a: any, b: any) => {
                                const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
                                const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
                                return bTime - aTime
                            })

                        setThreads(nonEmptyChats)
                    }
                } else if (data) {
                    // Get message counts for each chat
                    const threadsWithCounts = await Promise.all(
                        (data as any[]).map(async (chat) => {
                            const { count } = await supabase
                                .from('messages')
                                .select('*', { count: 'exact', head: true })
                                .eq('chat_id', chat.id)

                            return { ...chat, message_count: count || 0 }
                        })
                    )

                    // Filter out empty chats and sort by message count
                    const nonEmptyChats = threadsWithCounts
                        .filter((t: any) => t.message_count > 0)
                        .sort((a: any, b: any) => {
                            const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0
                            const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0
                            return bTime - aTime
                        })

                    setThreads(nonEmptyChats)
                }

                // Sync currentChatId
                const allFetched = (data as any[]) || []
                const active = allFetched.find(t => t.name === currentThreadName)
                if (active) setCurrentChatId(active.id)
            } catch (e) {
                console.error('❌ [ChatSoloEngine] Failed to fetch threads:', e)
            }
        }
        fetchThreads()
    }, [user, currentThreadName, personaId])

    /**
     * Fetch Bookmarks
     */
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!user) return
            try {
                const { data, error } = await supabase
                    .from('bookmarks')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                setBookmarks(data || [])
            } catch (e) {
                console.error('❌ [ChatSoloEngine] Failed to fetch bookmarks:', e)
            }
        }
        fetchBookmarks()
    }, [user])

    const toggleBookmark = useCallback(async (message: ChatMessageContent) => {
        if (!user || !message.id) return

        const isBookmarked = bookmarks.some(b => b.message_id === message.id)

        try {
            if (isBookmarked) {
                const { error } = await supabase
                    .from('bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('message_id', message.id)

                if (error) throw error
                setBookmarks(prev => prev.filter(b => b.message_id !== message.id))
            } else {
                // Use currentChatId if available, fallback to searching threads
                const targetChatId = currentChatId || threads.find(t => t.name === currentThreadName)?.id

                if (!targetChatId) {
                    console.error('❌ [ChatSoloEngine] Cannot bookmark: no active chatId found')
                    return
                }

                const { data, error } = await supabase
                    .from('bookmarks')
                    .insert({
                        user_id: user.id,
                        chat_id: targetChatId,
                        message_id: message.id,
                        content_preview: message.content.substring(0, 200) + (message.content.length > 200 ? '...' : '')
                    })
                    .select()
                    .single()

                if (error) throw error
                setBookmarks(prev => [data, ...prev])
            }
        } catch (e) {
            console.error('❌ [ChatSoloEngine] Toggle bookmark failed:', e)
        }
    }, [user, bookmarks, currentThreadName, threads])

    const toggleStar = useCallback(async (chatId: string, isStarred: boolean) => {
        try {
            const { error } = await supabase
                .from('chats')
                .update({ is_starred: isStarred } as any)
                .eq('id', chatId)

            if (error) throw error

            setThreads(prev => prev.map(t => t.id === chatId ? { ...t, is_starred: isStarred } : t))
        } catch (e) {
            console.error('❌ [ChatSoloEngine] Toggle star failed:', e)
        }
    }, [])

    const renameChat = useCallback(async (chatId: string, newTitle: string) => {
        try {
            const { error } = await supabase
                .from('chats')
                .update({ title: newTitle } as any)
                .eq('id', chatId)

            if (error) throw error

            setThreads(prev => prev.map(t => t.id === chatId ? { ...t, title: newTitle } : t))
        } catch (e) {
            console.error('❌ [ChatSoloEngine] Rename failed:', e)
        }
    }, [])

    const createNewChat = useCallback(() => {
        stopGeneration() // Stop any active response before switching
        const newName = `solo-cockpit-${Date.now()}`
        setCurrentThreadName(newName)
        setMessages([])
    }, [stopGeneration])

    const switchThread = useCallback((name: string) => {
        if (name === currentThreadName) return // Already on this thread
        stopGeneration() // Stop any active generation
        setMessages([]) // Clear immediately to avoid stale content
        setCurrentThreadName(name)
    }, [currentThreadName, stopGeneration])

    const sendMessage = useCallback(async (content: string, skipUserMessage: boolean = false) => {
        if (!content.trim() && !skipUserMessage) return
        if (isGenerating) return

        setError(null)
        setIsGenerating(true)
        const startingThread = currentThreadName // Capture current thread

        let currentMessages = [...messagesRef.current]

        if (!skipUserMessage) {
            const userMessage: ChatMessageContent = {
                role: 'user',
                content: content.trim(),
                timestamp: new Date()
            }
            currentMessages.push(userMessage)
            setMessages(currentMessages)
        }

        const assistantMessage: ChatMessageContent = {
            role: 'assistant',
            content: '',
            timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        abortControllerRef.current = new AbortController()

        try {
            const token = session?.access_token || getRecoveredToken()
            if (!token) console.error('🚫 [ChatSoloEngine] FATAL: No auth token available for chat request.')


            const response = await fetch('/api/v2/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
                    personaId,
                    llm_provider: llmProvider,
                    llm_model: llmModel,
                    customName: currentThreadName // Use the actual current thread name
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const providerId = response.headers.get('X-Provider') as ProviderId
            if (providerId) setCurrentProvider(providerId)

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No stream')

            const decoder = new TextDecoder()
            let fullContent = ''
            let fullReasoning = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim()
                        if (data === '[DONE]') continue

                        try {
                            const json = JSON.parse(data)
                            if (json.toolCalls) {
                            }

                            if (json.reasoning) {
                                fullReasoning += json.reasoning
                            }

                            if (json.content) {
                                fullContent += json.content

                                // Basic Artifact Detection (e.g. Code Blocks)
                                if (fullContent.includes('```')) {
                                    const parts = fullContent.split('```')
                                    if (parts.length >= 2) {
                                        // Extract content between first set of backticks
                                        const code = parts[1].split('```')[0]
                                        setActiveArtifact(code || null)
                                    }
                                }
                            }

                            if (json.reasoning || json.content) {
                                setMessages(prev => {
                                    if (currentThreadName !== startingThread) return prev // Don't update if thread changed
                                    const updated = [...prev]
                                    const last = updated[updated.length - 1]
                                    if (last && last.role === 'assistant') {
                                        last.content = fullContent
                                        if (fullReasoning) {
                                            last.metadata = { ...last.metadata, reasoning: fullReasoning }
                                        }
                                    }
                                    return updated
                                })
                            }

                            if (json.done && (json.userMessageId || json.assistantMessageId)) {
                                setMessages(prev => {
                                    if (currentThreadName !== startingThread) {
                                        console.warn(`⚠️ [ChatSoloEngine] Thread changed from ${startingThread} to ${currentThreadName}, discarding IDs.`);
                                        return prev
                                    }
                                    const updated = [...prev];
                                    if (updated.length >= 2) {
                                        const userIdx = updated.length - 2;
                                        const assistantIdx = updated.length - 1;

                                        if (json.userMessageId && updated[userIdx].role === 'user') {
                                            updated[userIdx].id = json.userMessageId;
                                        }
                                        if (json.assistantMessageId && updated[assistantIdx].role === 'assistant') {
                                            updated[assistantIdx].id = json.assistantMessageId;
                                        }
                                    } else {
                                        console.warn(`⚠️ [ChatSoloEngine] Not enough messages in state to apply IDs (${updated.length})`);
                                    }
                                    return updated;
                                });
                            }
                        } catch (e) { }
                    }
                }
            }
        } catch (err) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError(err.message)
            }
        } finally {
            setIsGenerating(false)
            abortControllerRef.current = null
        }
    }, [personaId, llmProvider, llmModel, session, currentThreadName])

    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    const setLLMConfig = useCallback((provider: string | null, model: string | null) => {
        setLLMProvider(provider)
        setLLMModel(model)
    }, [])

    const saveFeedback = useCallback(async (messageId: string, feedback: 'like' | 'dislike' | null) => {
        if (!user) return

        try {
            // Update local state
            setMessages(prev => prev.map(msg =>
                msg.id === messageId
                    ? { ...msg, metadata: { ...msg.metadata, feedback } }
                    : msg
            ))

            // Update database
            const { updateMessageMetadata } = await import('@/lib/chat-engine/persistence')
            // Get current message to preserve other metadata
            const msg = messagesRef.current.find(m => m.id === messageId)
            const metadata = { ...msg?.metadata, feedback }
            await updateMessageMetadata(supabase, messageId, metadata)

        } catch (e) {
            console.error('❌ [ChatSoloEngine] Feedback save failed:', e)
        }
    }, [user])

    const regenerateMessage = useCallback(async (messageId: string) => {
        const msgIdx = messagesRef.current.findIndex(m => m.id === messageId)
        if (msgIdx === -1) return

        const msg = messagesRef.current[msgIdx]
        if (msg.role !== 'assistant') return


        // 1. Remove the assistant message and everything after it
        const newMessages = messagesRef.current.slice(0, msgIdx)
        setMessages(newMessages)

        // 2. Trigger new generation
        // We need to wait a tick for state to update or use the slice directly in sendMessage
        // But sendMessage uses messagesRef.current internally.
        // Let's modify sendMessage slightly or pass the history.
        // Actually, sendMessage uses messagesRef.current which will be updated by the next tick if we don't await.
        // Better to just call it and it will use the truncated history.
        setTimeout(() => {
            sendMessage("", true)
        }, 0)
    }, [sendMessage])


    const value = useMemo(() => ({
        messages,
        isGenerating,
        currentProvider,
        userTier,
        error,
        personaId,
        isLoadingHistory,
        llmProvider,
        llmModel,
        activeArtifact,
        showThinking,
        sendMessage,
        stopGeneration,
        clearMessages,
        setLLMConfig,
        toggleThinking,
        toggleStar,
        renameChat,
        createNewChat,
        currentThreadName,
        currentChatId,
        threads,
        bookmarks,
        setCurrentThreadName,
        switchThread,
        toggleBookmark,
        saveFeedback,
        regenerateMessage
    }), [messages, isGenerating, currentProvider, userTier, error, personaId, isLoadingHistory, llmProvider, llmModel, activeArtifact, showThinking, sendMessage, stopGeneration, clearMessages, setLLMConfig, toggleThinking, toggleStar, renameChat, createNewChat, currentThreadName, currentChatId, threads, bookmarks, setCurrentThreadName, switchThread, toggleBookmark, saveFeedback, regenerateMessage])

    return (
        <ChatSoloEngineContext.Provider value={value}>
            {children}
        </ChatSoloEngineContext.Provider>
    )
}

export function useChatSolo() {
    const context = useContext(ChatSoloEngineContext)
    if (!context) throw new Error('useChatSolo must be used within ChatSoloEngineProvider')
    return context
}
