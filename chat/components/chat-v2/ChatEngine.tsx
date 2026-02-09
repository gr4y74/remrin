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
    useEffect,
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
import { routeForgeToolCall } from '@/lib/forge/tool-handlers'

interface ChatEngineState {
    messages: ChatMessageContent[]
    isGenerating: boolean
    currentProvider: ProviderId | null
    userTier: UserTier
    error: string | null
    personaId?: string
    isFollowingUp: boolean
    moodState: MoodState
    toolState: { name: string; status: 'idle' | 'running' | 'complete' | 'error' } | null
    isLoadingHistory: boolean
}

interface ChatEngineActions {
    sendMessage: (content: string, skipUserMessage?: boolean) => Promise<void>
    stopGeneration: () => void
    clearMessages: () => void
    setSystemPrompt: (prompt: string) => void
    addSystemMessage: (content: string) => void
    rewind: (index: number) => void
}

interface ChatEngineContextValue extends ChatEngineState, ChatEngineActions { }

const ChatEngineContext = createContext<ChatEngineContextValue | null>(null)

// Separate context for mood to allow independent hook
const MoodContext = createContext<MoodState | null>(null)

interface ChatEngineProviderProps {
    children: ReactNode
    personaId?: string
    initialSystemPrompt?: string
    personaIntroMessage?: string
    userTier?: UserTier
    showMoodHUD?: boolean
}

export function ChatEngineProvider({
    children,
    personaId,
    initialSystemPrompt = '',
    personaIntroMessage,
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
    const [toolState, setToolState] = useState<{ name: string; status: 'idle' | 'running' | 'complete' | 'error' } | null>(null)

    const [isLoadingHistory, setIsLoadingHistory] = useState(false)

    const abortControllerRef = useRef<AbortController | null>(null)
    const messagesRef = useRef<ChatMessageContent[]>([])

    // Keep ref in sync
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    /**
     * Load history when persona changes
     */
    useEffect(() => {
        if (!personaId) {
            setMessages([])
            return
        }

        const fetchHistory = async () => {
            setIsLoadingHistory(true)
            try {
                console.log(`📜 [ChatEngine] Loading history for persona ${personaId}...`)
                const res = await fetch(`/api/v2/chat/history?personaId=${personaId}`, {
                    credentials: 'include'
                })

                if (res.ok) {
                    const history = await res.json()

                    if (history && history.length > 0) {
                        console.log(`📜 [ChatEngine] Loaded ${history.length} messages`)
                        // Convert timestamps
                        const processedHistory = history.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        }))
                        setMessages(processedHistory)
                    } else if (personaIntroMessage) {
                        // Only show intro if NO history exists
                        console.log("🕯️ [ChatEngine] No history, seeding intro message...")
                        setMessages([{
                            role: 'assistant',
                            content: personaIntroMessage,
                            timestamp: new Date()
                        }])
                    } else {
                        setMessages([])
                    }
                }
            } catch (e) {
                console.error('❌ [ChatEngine] Failed to load history:', e)
            } finally {
                setIsLoadingHistory(false)
            }
        }

        fetchHistory()
    }, [personaId, personaIntroMessage])

    /**
     * Send a message and stream the response
     */
    const sendMessage = useCallback(async (content: string, skipUserMessage: boolean = false) => {
        if (!content.trim() && !skipUserMessage) return
        if (isGenerating) return

        setError(null)
        setIsGenerating(true)

        // Use ref to get latest messages to avoid staleness in closures
        let currentMessages = [...messagesRef.current]

        if (!skipUserMessage) {
            // Add user message
            const userMessage: ChatMessageContent = {
                role: 'user',
                content: content.trim(),
                timestamp: new Date()
            }
            // Update both Ref and State immediately for optimistic update
            currentMessages.push(userMessage)
            messagesRef.current = currentMessages
            setMessages(currentMessages)
        }

        // Add placeholder assistant message
        const assistantMessage: ChatMessageContent = {
            role: 'assistant',
            content: '',
            timestamp: new Date()
        }

        // We don't add this to currentMessages for the API call (API doesn't want empty assistant msg at end)
        setMessages(prev => [...prev, assistantMessage])

        // Create abort controller
        abortControllerRef.current = new AbortController()

        try {
            // Build messages to send
            const messagesToSend = currentMessages.map(m => ({
                role: m.role,
                content: m.content,
                tool_call_id: m.role === 'tool' ? m.tool_call_id : undefined,
                tool_calls: m.metadata?.toolCalls?.map(tc => ({
                    id: tc.id,
                    type: tc.type,
                    function: tc.function
                }))
            }))

            const response = await fetch('/api/v2/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    messages: messagesToSend,
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
            let accumulatedToolCalls: any[] = []

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

                            if (json.toolCalls) {
                                // Collect tool calls
                                for (const tc of json.toolCalls) {
                                    const idx = tc.index ?? 0
                                    if (!accumulatedToolCalls[idx]) {
                                        // Initialize new tool call
                                        accumulatedToolCalls[idx] = {
                                            id: tc.id || '',
                                            type: tc.type || 'function',
                                            function: {
                                                name: tc.function?.name || '',
                                                arguments: tc.function?.arguments || ''
                                            }
                                        }
                                    } else {
                                        // Merge delta
                                        if (tc.id) {
                                            accumulatedToolCalls[idx].id = tc.id
                                        }
                                        if (tc.function?.name) {
                                            accumulatedToolCalls[idx].function.name = tc.function.name
                                        }
                                        if (tc.function?.arguments) {
                                            const currentArgs = accumulatedToolCalls[idx].function.arguments
                                            // Handle edge case: if current args are just "{}" and new args start with "{",
                                            // replace instead of append to avoid "{}{...}" malformed JSON
                                            if (currentArgs === '{}' && tc.function.arguments.startsWith('{')) {
                                                accumulatedToolCalls[idx].function.arguments = tc.function.arguments
                                            } else {
                                                accumulatedToolCalls[idx].function.arguments += tc.function.arguments
                                            }
                                        }
                                    }
                                }

                                // Update the assistant message metadata with tool calls
                                setMessages(prev => {
                                    const updated = [...prev]
                                    const lastIdx = updated.length - 1
                                    if (updated[lastIdx]?.role === 'assistant') {
                                        updated[lastIdx] = {
                                            ...updated[lastIdx],
                                            metadata: {
                                                ...updated[lastIdx].metadata,
                                                toolCalls: accumulatedToolCalls.filter(Boolean)
                                            }
                                        }
                                    }
                                    return updated
                                })
                            }

                            if (json.content) {
                                fullContent += json.content

                                // Update the assistant message content
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
                                // ... (retaining followup logic)
                                setIsFollowingUp(true)
                                setTimeout(() => {
                                    setIsFollowingUp(false)
                                    setMessages(prev => {
                                        const updated = [...prev]
                                        const lastIdx = updated.length - 1
                                        if (updated[lastIdx]?.role === 'assistant') {
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
                            // If it's a known error we threw, rethrow it to the outer catch
                            if (e instanceof Error && (e.message.includes('429') || e.message.includes('API error'))) {
                                throw e
                            }
                            console.error(`[ChatEngine] Failed to parse SSE data: ${e}`, data)
                        }
                    }
                }
            }

            // --- Tool Call Execution ---
            const finalToolCalls = accumulatedToolCalls.filter(Boolean)
            if (finalToolCalls.length > 0) {
                console.log(`🔧 [ChatEngine] Executing ${finalToolCalls.length} tool calls`)

                const toolResults: ChatMessageContent[] = []

                for (const toolCall of finalToolCalls) {
                    const toolName = toolCall.function.name
                    let args = {}
                    try {
                        args = JSON.parse(toolCall.function.arguments || '{}')
                    } catch (e) {
                        console.error(`[ChatEngine] Failed to parse tool arguments for ${toolName}:`, e)
                    }

                    console.log(`🔍 [ChatEngine] Executing tool: ${toolName}`, args)
                    setToolState({ name: toolName, status: 'running' })

                    // Route tool call to specialized handlers
                    const result = await routeForgeToolCall(
                        toolName,
                        args,
                        () => setToolState({ name: toolName, status: 'running' }),
                        (imageUrl) => {
                            setToolState({ name: toolName, status: 'complete' })
                        },
                        (data) => { }, // onReveal (empty for now as loop handles it? Wait, checking signature... arg 5 is onReveal)
                        personaId
                    )

                    console.log(`✅ [ChatEngine] Tool ${toolName} completed:`, result.success)

                    // Add tool response to history
                    toolResults.push({
                        role: 'tool',
                        content: typeof result.result === 'string' ? result.result : JSON.stringify(result.result),
                        tool_call_id: toolCall.id,
                        timestamp: new Date(),
                        metadata: { toolResult: result.result }
                    })
                }

                // Add all tool responses to history and trigger ONE next pass
                // IMPORTANT: We must NOT let the finally block run, so we handle cleanup here
                setMessages(prev => {
                    const nextMessages = [...prev, ...toolResults]
                    return nextMessages
                })

                // Reset generating state so the follow-up can run
                setIsGenerating(false)
                setToolState(null)
                abortControllerRef.current = null

                // Schedule the follow-up call to get the final answer
                setTimeout(() => sendMessage('', true), 100)

                // Return early to prevent the finally block from running again
                return
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
            }
        } finally {
            setIsGenerating(false)
            setIsFollowingUp(false)
            setToolState(null)
            abortControllerRef.current = null
        }
    }, [messages, isGenerating, personaId, systemPrompt, moodState])

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

    /**
     * Rewind conversation to a specific index
     * Removes all messages AFTER this index.
     * If the target message is Assistant, it removes it too to trigger regen?
     * Strategy: "Rewind to here" = User wants to retry from this point.
     * So we keep messages[0...index].
     */
    const rewind = useCallback((index: number) => {
        setMessages(prev => {
            // Keep the message at index, remove everything after
            // If the user clicked "Rewind" on an Assistant message, they usually want to regenerate IT.
            // If they clicked on a User message, they might want to edit it.
            // For now, simple slice: keep everything UP TO index.
            const newHistory = prev.slice(0, index + 1)

            // If the last message is now Assistant, remove it too so we can regen? 
            // Or just leave it as the 'latest' state.
            // Let's just slice for now.
            return newHistory
        })
    }, [])

    const value: ChatEngineContextValue = useMemo(() => ({
        messages,
        isGenerating,
        currentProvider,
        userTier,
        error,
        personaId,
        moodState,
        toolState,
        isFollowingUp,
        sendMessage,
        stopGeneration,
        clearMessages,
        setSystemPrompt,
        addSystemMessage,
        rewind,
        isLoadingHistory
    }), [
        messages,
        isGenerating,
        currentProvider,
        userTier,
        error,
        personaId,
        moodState,
        toolState,
        isFollowingUp,
        sendMessage,
        stopGeneration,
        clearMessages,
        setSystemPrompt,
        addSystemMessage,
        rewind,
        isLoadingHistory
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
