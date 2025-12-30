/**
 * Remrin Locket - Type Definitions
 */

// Soul/Persona data from Remrin backend
export interface Soul {
    id: string
    name: string
    avatar_url: string | null
    system_prompt: string
    locket_data: string | null
    config: {
        temperature?: number
        [key: string]: unknown
    }
    created_at: string
}

// RAG search result
export interface RAGResult {
    content: string
    similarity: number
    source: string
}

// Site configuration for different LLM platforms
export interface SiteConfig {
    name: string
    hostname: string
    inputSelector: string
    submitSelector: string
    messageContainerSelector: string
    injectPosition: 'before' | 'after' | 'inside'
}

// Extension state stored in chrome.storage
export interface ExtensionState {
    isAuthenticated: boolean
    userId: string | null
    activeSoulId: string | null
    souls: Soul[]
    sessionState: Record<string, SessionState>
}

// Per-tab session state
export interface SessionState {
    tabId: number
    url: string
    injected: boolean
    soulId: string | null
    messageCount: number
}

// Message types for extension communication
export type MessageType =
    | 'GET_SOULS'
    | 'SET_ACTIVE_SOUL'
    | 'GET_RAG_CONTEXT'
    | 'LOGIN'
    | 'LOGOUT'
    | 'GET_STATE'
    | 'INJECTION_COMPLETE'

export interface ExtensionMessage {
    type: MessageType
    payload?: unknown
}

export interface ExtensionResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
}
