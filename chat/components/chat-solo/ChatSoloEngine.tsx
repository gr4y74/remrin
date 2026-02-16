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
    threads: any[]
}

interface ChatSoloEngineActions {
    sendMessage: (content: string, skipUserMessage?: boolean) => Promise<void>
    stopGeneration: () => void
    clearMessages: () => void
    setLLMConfig: (provider: string | null, model: string | null) => void
    toggleThinking: () => void
    createNewChat: () => void
    setCurrentThreadName: (name: string) => void
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

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    /**
     * Load Solo History
     */
    useEffect(() => {
        const fetchSoloHistory = async () => {
            if (!user) return

            setIsLoadingHistory(true)
            try {
                const token = session?.access_token || getRecoveredToken()
                if (!token) console.warn('🕵️ [ChatSoloEngine] No auth token available for history fetch.')

                console.log(`📡 [ChatSoloEngine] Fetching history with token prefix: ${token?.substring(0, 10)}...`)

                const response = await fetch(`/api/v2/chat/history?personaId=${personaId}&customName=${currentThreadName}`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                    credentials: 'include'
                })

                if (response.ok) {
                    const history = await response.json()
                    if (history && history.length > 0) {
                        setMessages(history.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        })))
                    } else {
                        // If no history, show intro
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
                }
            } catch (e) {
                console.error('❌ [ChatSoloEngine] Failed to load history:', e)
            } finally {
                setIsLoadingHistory(false)
            }
        }

        fetchSoloHistory()
    }, [personaId, personaIntroMessage, user, currentThreadName])

    /**
     * Fetch Threads List
     */
    useEffect(() => {
        const fetchThreads = async () => {
            if (!user) return
            try {
                const { data } = await supabase
                    .from('chats')
                    .select('id, name, created_at')
                    .eq('user_id', user.id)
                    .or(`name.ilike.persona-chat-${personaId}%,name.ilike.solo-cockpit-%`)
                    .order('created_at', { ascending: false })

                if (data) setThreads(data)
            } catch (e) {
                console.error('❌ [ChatSoloEngine] Failed to fetch threads:', e)
            }
        }
        fetchThreads()
    }, [user, currentThreadName])

    const createNewChat = useCallback(() => {
        const newName = `solo-cockpit-${Date.now()}`
        setCurrentThreadName(newName)
        setMessages([])
    }, [])

    const sendMessage = useCallback(async (content: string, skipUserMessage: boolean = false) => {
        if (!content.trim() && !skipUserMessage) return
        if (isGenerating) return

        setError(null)
        setIsGenerating(true)

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

            console.log(`📡 [ChatSoloEngine] Sending chat with token prefix: ${token?.substring(0, 10)}...`)

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
                                console.log(`🛠️ [ChatSoloEngine] Tool Call Part (Round ${json.depth || 0}):`, json.toolCalls);
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
                                    const updated = [...prev]
                                    const last = updated[updated.length - 1]
                                    if (last.role === 'assistant') {
                                        last.content = fullContent
                                        if (fullReasoning) {
                                            last.metadata = { ...last.metadata, reasoning: fullReasoning }
                                        }
                                    }
                                    return updated
                                })
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
    }, [personaId, llmProvider, llmModel])

    const stopGeneration = useCallback(() => {
        abortControllerRef.current?.abort()
    }, [])

    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    const setLLMConfig = useCallback((provider: string | null, model: string | null) => {
        setLLMProvider(provider)
        setLLMModel(model)
    }, [])


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
        createNewChat,
        currentThreadName,
        threads,
        setCurrentThreadName
    }), [messages, isGenerating, currentProvider, userTier, error, personaId, isLoadingHistory, llmProvider, llmModel, activeArtifact, showThinking, sendMessage, stopGeneration, clearMessages, setLLMConfig, toggleThinking, createNewChat, currentThreadName, threads, setCurrentThreadName])

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
