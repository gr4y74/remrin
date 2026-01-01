/**
 * Chat Engine - Main Controller
 * 
 * Central state management for the v2 chat system
 */

"use client"

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useRef,
    useMemo,
    ReactNode
} from 'react'
import { ChatMessageContent, ProviderId, UserTier } from '@/lib/chat-engine/types'
import {
    MoodState,
    calculateMood,
    getInitialMoodState,
    detectSentiment
} from '@/lib/chat-engine/mood'

interface ChatEngineState {
    messages: ChatMessageContent[]
    isGenerating: boolean
    currentProvider: ProviderId | null
    userTier: UserTier
    error: string | null
    personaId?: string
    isFollowingUp: boolean
    moodState: MoodState
}

interface ChatEngineActions {
    sendMessage: (content: string) => Promise<void>
    stopGeneration: () => void
    clearMessages: () => void
    setSystemPrompt: (prompt: string) => void
    addSystemMessage: (content: string) => void
}

interface ChatEngineContextValue extends ChatEngineState, ChatEngineActions { }

const ChatEngineContext = createContext<ChatEngineContextValue | null>(null)

// Separate context for mood to allow independent hook
const MoodContext = createContext<MoodState | null>(null)

interface ChatEngineProviderProps {
    children: ReactNode
    personaId?: string
    initialSystemPrompt?: string
    userTier?: UserTier
    showMoodHUD?: boolean
}

export function ChatEngineProvider({
    children,
    personaId,
    initialSystemPrompt = '',
    userTier = 'free',
    showMoodHUD = true
}: ChatEngineProviderProps) {
    const [messages, setMessages] = useState<ChatMessageContent[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentProvider, setCurrentProvider] = useState<ProviderId | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt)
    const [isFollowingUp, setIsFollowingUp] = useState(false)
    const [moodState, setMoodState] = useState<MoodState>(getInitialMoodState())

    const abortControllerRef = useRef<AbortController | null>(null)

    /**
     * Send a message and stream the response
     */
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isGenerating) return

        setError(null)
        setIsGenerating(true)

        // Add user message
        const userMessage: ChatMessageContent = {
            role: 'user',
            content: content.trim(),
            timestamp: new Date()
        }

        // Add placeholder assistant message
        const assistantMessage: ChatMessageContent = {
            role: 'assistant',
            content: '',
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage, assistantMessage])

        // Create abort controller
        abortControllerRef.current = new AbortController()

        try {
            const response = await fetch('/api/v2/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    personaId,
                    systemPrompt
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            // Get provider from header
            const providerId = response.headers.get('X-Provider') as ProviderId
            if (providerId) setCurrentProvider(providerId)

            // Read SSE stream
            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response body')

            const decoder = new TextDecoder()
            let buffer = ''
            let fullContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim()
                        if (data === '[DONE]') continue

                        try {
                            const json = JSON.parse(data)

                            if (json.error) {
                                throw new Error(json.error)
                            }

                            if (json.content) {
                                fullContent += json.content

                                // Update the assistant message
                                setMessages(prev => {
                                    const updated = [...prev]
                                    const lastIdx = updated.length - 1
                                    if (updated[lastIdx]?.role === 'assistant') {
                                        updated[lastIdx] = {
                                            ...updated[lastIdx],
                                            content: fullContent,
                                            metadata: {
                                                ...updated[lastIdx].metadata,
                                                provider: json.provider
                                            }
                                        }
                                    }
                                    return updated
                                })
                            }

                            if (json.type === 'followup' && json.content) {
                                // Set following up state (showing a brief "thinking" pause)
                                setIsFollowingUp(true)

                                // Wait a bit before appending to feel natural
                                setTimeout(() => {
                                    setIsFollowingUp(false)
                                    setMessages(prev => {
                                        const updated = [...prev]
                                        const lastIdx = updated.length - 1
                                        if (updated[lastIdx]?.role === 'assistant') {
                                            // Add a double newline before follow-up if it's the start
                                            const prefix = updated[lastIdx].content.endsWith('\n\n') ? '' :
                                                updated[lastIdx].content.endsWith('\n') ? '\n' : '\n\n'

                                            updated[lastIdx] = {
                                                ...updated[lastIdx],
                                                content: updated[lastIdx].content + (json.content.startsWith('\n') ? '' : prefix) + json.content
                                            }
                                        }
                                        return updated
                                    })
                                }, 500)
                            }
                        } catch (e) {
                            // Skip parse errors for incomplete chunks
                        }
                    }
                }
            }

            // Update mood state after message exchange
            const sentiment = detectSentiment(fullContent)
            const newMoodState = calculateMood(
                messages.length + 2,
                fullContent.length,
                sentiment,
                moodState.battery
            )
            setMoodState(newMoodState)

        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('Generation aborted by user')
            } else {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error'
                setError(errorMessage)
                console.error('Chat error:', err)

                // Remove the empty assistant message on error
                setMessages(prev => {
                    const updated = [...prev]
                    if (updated[updated.length - 1]?.content === '') {
                        updated.pop()
                    }
                    return updated
                })
            }
        } finally {
            setIsGenerating(false)
            setIsFollowingUp(false)
            abortControllerRef.current = null
        }
    }, [messages, isGenerating, personaId, systemPrompt])

    /**
     * Stop the current generation
     */
    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
    }, [])

    /**
     * Clear all messages
     */
    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
        setMoodState(getInitialMoodState()) // Reset mood on clear
    }, [])

    /**
     * Add a system message to history
     */
    const addSystemMessage = useCallback((content: string) => {
        const systemMsg: ChatMessageContent = {
            role: 'system',
            content,
            timestamp: new Date()
        }
        setMessages(prev => [...prev, systemMsg])
    }, [])

    const value: ChatEngineContextValue = useMemo(() => ({
        messages,
        isGenerating,
        currentProvider,
        userTier,
        error,
        personaId,
        moodState,
        isFollowingUp,
        sendMessage,
        stopGeneration,
        clearMessages,
        setSystemPrompt,
        addSystemMessage
    }), [
        messages,
        isGenerating,
        currentProvider,
        userTier,
        error,
        personaId,
        moodState,
        isFollowingUp,
        sendMessage,
        stopGeneration,
        clearMessages,
        setSystemPrompt,
        addSystemMessage
    ])

    return (
        <MoodContext.Provider value={moodState}>
            <ChatEngineContext.Provider value={value}>
                {children}
            </ChatEngineContext.Provider>
        </MoodContext.Provider>
    )
}

/**
 * Hook to use the chat engine
 */
export function useChatEngine() {
    const context = useContext(ChatEngineContext)
    if (!context) {
        throw new Error('useChatEngine must be used within ChatEngineProvider')
    }
    return context
}

/**
 * Hook to use mood state independently
 */
export function useMood() {
    const context = useContext(MoodContext)
    if (!context) {
        throw new Error('useMood must be used within ChatEngineProvider')
    }
    return context
}
