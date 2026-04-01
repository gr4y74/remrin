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
import { isFeedbackTrigger, FEEDBACK_QUESTIONS, FEEDBACK_SYSTEM_INJECTION } from '@/lib/feedback-system'

export interface Bookmark {
    id: string
    user_id: string
    chat_id: string
    message_id: string
    folder_id?: string
    content_preview: string | null
    note?: string
    metadata: any
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
    isThinking: boolean
    currentThreadName: string
    currentChatId: string | null
    threads: any[]
    bookmarks: Bookmark[]
    uploadedFiles: Array<{ temp_id: string, name: string, content: string, type: string, storagePath?: string }>
    // Feedback Mode State
    feedbackMode: boolean
    feedbackStep: number
    feedbackAnswers: Array<{ key: string, answer: string }>
    feedbackSessionId: number | null
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
    editMessage: (messageId: string, newContent: string) => Promise<void>
    viewArtifact: (content: string) => void
    addUploadedFile: (file: { temp_id: string, name: string, content: string, type: string, storagePath?: string }) => void
    updateUploadedFile: (temp_id: string, metadata: Partial<{ name: string, content: string, type: string, storagePath: string }>) => void
    removeUploadedFile: (index: number) => void
    clearUploadedFiles: () => void
    activateFeedbackMode: () => void
    resetFeedbackMode: () => void
    engineId: string
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
    const [engineId] = useState(() => Math.random().toString(36).substring(7))
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
    const [isThinking, setIsThinking] = useState(false)
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [currentChatId, setCurrentChatId] = useState<string | null>(null)
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ temp_id: string, name: string, content: string, type: string, storagePath?: string }>>([])
    const uploadedFilesRef = useRef(uploadedFiles)

    // Feedback Mode State
    const [feedbackMode, setFeedbackMode] = useState(false)
    const [feedbackStep, setFeedbackStep] = useState(0)
    const [feedbackAnswers, setFeedbackAnswers] = useState<Array<{ key: string, answer: string }>>([])
    const [feedbackSessionId, setFeedbackSessionId] = useState<number | null>(null)

    // Sync ref with state
    useEffect(() => {
        uploadedFilesRef.current = uploadedFiles
        console.log(`🔄 [Engine:${engineId}] uploadedFiles state updated:`, uploadedFiles.length)
    }, [uploadedFiles, engineId])

    // Detect unmounts
    useEffect(() => {
        console.log(`✅ [Engine:${engineId}] Component MOUNTED`)
        return () => console.log(`❌ [Engine:${engineId}] Component UNMOUNTED`)
    }, [engineId])

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
                // Silenced warning during auth initialization
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
                    .limit(20)

                if (error) {
                    console.warn('⚠️ [ChatSoloEngine] Threads fetch failed, falling back to basic...', error.message)
                    const { data: basicData } = await supabase
                        .from('chats')
                        .select('id, name, created_at, updated_at')
                        .eq('user_id', user.id)
                        .or(`name.ilike.persona-chat-${personaId}%,name.ilike.solo-cockpit-%`)
                        .order('updated_at', { ascending: false })
                        .limit(20)

                    if (basicData) {
                        // REMOVED: N+1 count per-thread queries to prevent 503 errors
                        const legacyThreads = basicData.map(chat => ({ 
                            ...chat, 
                            title: null, 
                            is_starred: false, 
                            message_count: 0 
                        }))
                        setThreads(legacyThreads)
                    }
                } else if (data) {
                    // REMOVED: N+1 count per-thread queries to prevent 503 errors
                    const cleanThreads = (data as any[]).map(chat => ({
                        ...chat,
                        message_count: 0
                    }))
                    setThreads(cleanThreads)
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

    const addUploadedFile = useCallback((file: { temp_id: string, name: string, content: string, type: string, storagePath?: string }) => {
        console.log(`📥 [Engine:${engineId}] addUploadedFile called for:`, file.name)
        setUploadedFiles(prev => [...prev, file])
    }, [engineId])
    
    const updateUploadedFile = useCallback((temp_id: string, metadata: Partial<{ name: string, content: string, type: string, storagePath: string }>) => {
        setUploadedFiles(prev => prev.map(f => f.temp_id === temp_id ? { ...f, ...metadata } : f))
    }, [])

    const removeUploadedFile = useCallback((index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    }, [])

    const clearUploadedFiles = useCallback(() => {
        setUploadedFiles([])
    }, [])

    /**
     * FEEDBACK MODE LOGIC
     */
    const activateFeedbackMode = useCallback(() => {
        setFeedbackMode(true)
        setFeedbackStep(0)
        setFeedbackAnswers([])
        setFeedbackSessionId(Date.now())

        // Force a small delay to simulate processing, then Rem introduces the mode
        setTimeout(() => {
            const introMsg: ChatMessageContent = {
                role: 'assistant',
                content: `Of course... Rem is glad you'd like to share your thoughts. 💙 Your feedback will go directly to Sosu, who reads every word personally.\n\nBefore we begin — may I ask your name? Rem would like to remember who she's speaking with.`,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, introMsg])
        }, 100)
    }, [])

    const resetFeedbackMode = useCallback(() => {
        setFeedbackMode(false)
        setFeedbackStep(0)
        setFeedbackAnswers([])
        setFeedbackSessionId(null)
    }, [])

    const compileFeedbackReport = useCallback(async (answers: Array<{ key: string, answer: string }>) => {
        const reportLines = [
            `REMRIN ALPHA FEEDBACK REPORT`,
            `Date: ${new Date().toLocaleDateString()}`,
            `Session ID: ${feedbackSessionId}`,
            ``,
            ...answers.map(a => `${a.key.toUpperCase().replace(/_/g, ' ')}: ${a.answer}`),
        ]
        const reportText = reportLines.join('\n')

        // mailto fallback
        const mailtoLink = `mailto:sosu.remrin@gmail.com?subject=${encodeURIComponent('Remrin Alpha Feedback')}&body=${encodeURIComponent(reportText)}`
        window.open(mailtoLink, '_blank')

        // API POST template
        try {
            await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report: reportText, sessionId: feedbackSessionId }),
            })
        } catch (e) {
            console.warn('[FeedbackMode] API POST failed, but mailto was triggered:', e)
        }
    }, [feedbackSessionId])

    const handleFeedbackMessage = useCallback(async (userMessage: string) => {
        const step = feedbackStep
        const question = FEEDBACK_QUESTIONS[step]

        // 1. Save the answer
        const updatedAnswers = [
            ...feedbackAnswers,
            { key: question.key, answer: userMessage }
        ]

        const nextStep = step + 1
        const isComplete = nextStep >= FEEDBACK_QUESTIONS.length

        setFeedbackStep(nextStep)
        setFeedbackAnswers(updatedAnswers)

        // 2. Add user message to state manually
        const userMsg: ChatMessageContent = { role: 'user', content: userMessage, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        
        // Assistant thinking state
        setIsGenerating(true)
        setIsThinking(true)

        // 3. Build injected system prompt
        const injectedSystem = FEEDBACK_SYSTEM_INJECTION
            .replace('{STEP}', String(nextStep))
            .replace('{FOCUS}', isComplete ? 'closing' : FEEDBACK_QUESTIONS[nextStep]?.key || 'closing')

        try {
            const token = session?.access_token || getRecoveredToken()
            const response = await fetch('/api/v2/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    messages: [...messagesRef.current, userMsg].map(m => ({ role: m.role, content: m.content })),
                    personaId,
                    systemPrompt: injectedSystem, // Hijack system prompt for interview logic
                    customName: currentThreadName
                }),
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const reader = response.body?.getReader()
            if (!reader) throw new Error('No stream')

            const decoder = new TextDecoder()
            let fullContent = ''

            // Simple assistant message placeholder
            setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }])

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
                            if (json.content) {
                                fullContent += json.content
                                setIsThinking(false)
                                setMessages(prev => {
                                    const updated = [...prev]
                                    const last = updated[updated.length - 1]
                                    if (last && last.role === 'assistant') {
                                        last.content = fullContent
                                    }
                                    return updated
                                })
                            }
                        } catch (e) { }
                    }
                }
            }

            // check for completion
            if (fullContent.includes('[FEEDBACK_COMPLETE]')) {
                const cleanResponse = fullContent.replace('[FEEDBACK_COMPLETE]', '').trim()
                setMessages(prev => {
                    const updated = [...prev]
                    const last = updated[updated.length - 1]
                    if (last && last.role === 'assistant') {
                        last.content = cleanResponse
                    }
                    return updated
                })
                await compileFeedbackReport(updatedAnswers)
                resetFeedbackMode()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
            setIsThinking(false)
        }
    }, [feedbackStep, feedbackAnswers, personaId, session, currentThreadName, compileFeedbackReport, resetFeedbackMode])

    const sendMessage = useCallback(async (content: string, skipUserMessage: boolean = false) => {
        const currentUploadedFiles = uploadedFilesRef.current
        console.log(`📝 [Engine:${engineId}] sendMessage triggered:`, { 
            hasContent: !!content, 
            skipUserMessage, 
            fileCount: currentUploadedFiles.length,
            fileNames: currentUploadedFiles.map(f => f.name)
        })

        if (!content.trim() && !skipUserMessage && currentUploadedFiles.length === 0) return
        if (isGenerating) return

        // ── FEEDBACK MODE INTERCEPTION ──────────────────────────────
        const userContent = content.trim();
        
        if (!feedbackMode && isFeedbackTrigger(userContent)) {
            activateFeedbackMode();
            return;
        }

        if (feedbackMode) {
            await handleFeedbackMessage(userContent);
            return;
        }
        // ────────────────────────────────────────────────────────────

        setError(null)
        setIsGenerating(true)
        setIsThinking(true)
        const startingThread = currentThreadName // Capture current thread

        let currentMessages = [...messagesRef.current]

        if (!skipUserMessage) {
            let finalContent = content.trim()

            const userMessage: ChatMessageContent = {
                role: 'user',
                content: finalContent,
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
                    llm_provider: currentProvider || llmProvider,
                    llm_model: llmModel,
                    files: currentUploadedFiles.map(f => ({
                        id: f.temp_id,
                        name: f.name,
                        type: f.type,
                        content: f.content,
                        storagePath: f.storagePath
                    })),
                    customName: currentThreadName 
                }),
                signal: abortControllerRef.current.signal
            })

            const payloadStr = JSON.stringify({ messages: currentMessages.length, files: currentUploadedFiles.length })
            console.log(`🚀 [Engine:${engineId}] Raw payload length (approx): ${payloadStr.length} chars.`)

            console.log(`🚀 [Engine:${engineId}] Fetch initiated. Files in state:`, uploadedFiles.length)

            console.log(`🚀 [Engine:${engineId}] Payload sent:`, {
                messages: currentMessages.length,
                files: currentUploadedFiles.map(f => ({ 
                    name: f.name, 
                    hasStorage: !!f.storagePath, 
                    contentLen: f.content?.length,
                    storagePath: f.storagePath
                }))
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            // SUCCESS: Clear the draft files from UI
            setUploadedFiles([])
            
            const providerId = response.headers.get('X-Provider') as ProviderId
            if (providerId) setCurrentProvider(providerId)

            // Successfully sent, now clear the draft files
            setUploadedFiles([])

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
                                setIsThinking(false)
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
            setIsThinking(false)
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

    const viewArtifact = useCallback((content: string) => {
        setActiveArtifact(content)
    }, [])

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
    const editMessage = useCallback(async (messageId: string, newContent: string) => {
        const msgIdx = messagesRef.current.findIndex(m => m.id === messageId)
        if (msgIdx === -1) return

        const msg = messagesRef.current[msgIdx]
        if (msg.role !== 'user') return

        // 1. Remove that message and everything after it
        const truncatedHistory = messagesRef.current.slice(0, msgIdx)
        setMessages(truncatedHistory)

        // 2. Re-send with the new content
        // We defer to ensure messages state is updated (or at least the ref is syncable)
        setTimeout(() => {
            sendMessage(newContent)
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
        isThinking,
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
        regenerateMessage,
        editMessage,
        viewArtifact,
        uploadedFiles,
        addUploadedFile,
        updateUploadedFile,
        removeUploadedFile,
        clearUploadedFiles,
        activateFeedbackMode,
        resetFeedbackMode,
        feedbackMode,
        feedbackStep,
        feedbackAnswers,
        feedbackSessionId,
        engineId
    }), [messages, isGenerating, currentProvider, userTier, error, personaId, isLoadingHistory, llmProvider, llmModel, activeArtifact, showThinking, isThinking, sendMessage, stopGeneration, clearMessages, setLLMConfig, toggleThinking, toggleStar, renameChat, createNewChat, currentThreadName, currentChatId, threads, bookmarks, setCurrentThreadName, switchThread, toggleBookmark, saveFeedback, regenerateMessage, editMessage, viewArtifact, uploadedFiles, addUploadedFile, updateUploadedFile, removeUploadedFile, clearUploadedFiles, activateFeedbackMode, resetFeedbackMode, feedbackMode, feedbackStep, feedbackAnswers, feedbackSessionId, engineId])

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
