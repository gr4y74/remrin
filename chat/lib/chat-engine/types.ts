/**
 * Remrin Chat Engine - Core Types
 * 
 * Modular, tier-based chat system replacing ChatbotUI
 */

// ============================================================================
// User Tiers
// ============================================================================

export type UserTier = 'free' | 'pro' | 'premium' | 'enterprise'

export interface TierConfig {
    tier: UserTier
    allowedProviders: ProviderId[]
    allowedCapabilities: CapabilityId[]
    rateLimitPerHour: number
    maxContextLength: number
    maxSoulsPerMonth: number
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
    free: {
        tier: 'free',
        allowedProviders: ['openrouter', 'openai'], // ADDED: openai as fallback
        allowedCapabilities: ['basic-search'],
        rateLimitPerHour: 50,
        maxContextLength: 8000,
        maxSoulsPerMonth: 3
    },
    pro: {
        tier: 'pro',
        allowedProviders: ['openrouter', 'openai', 'deepseek', 'claude'],
        allowedCapabilities: ['basic-search', 'full-search', 'file-upload'],
        rateLimitPerHour: 200,
        maxContextLength: 32000,
        maxSoulsPerMonth: 20
    },
    premium: {
        tier: 'premium',
        allowedProviders: ['openrouter', 'openai', 'deepseek', 'claude', 'gemini'],
        allowedCapabilities: ['basic-search', 'full-search', 'file-upload', 'reasoning'],
        rateLimitPerHour: 500,
        maxContextLength: 128000,
        maxSoulsPerMonth: 100
    },
    enterprise: {
        tier: 'enterprise',
        allowedProviders: ['openrouter', 'openai', 'deepseek', 'claude', 'gemini', 'custom'],
        allowedCapabilities: ['basic-search', 'full-search', 'file-upload', 'reasoning', 'custom-api'],
        rateLimitPerHour: -1, // Unlimited
        maxContextLength: 200000,
        maxSoulsPerMonth: -1 // Unlimited
    }
}

// ============================================================================
// Providers
// ============================================================================

export type ProviderId = 'openrouter' | 'openai' | 'deepseek' | 'claude' | 'gemini' | 'custom'

export interface ProviderConfig {
    id: ProviderId
    name: string
    apiEndpoint: string
    apiKeyEnv: string
    isEnabled: boolean
    defaultModel: string
    maxTokens: number
}

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter (FREE)',
        apiEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
        apiKeyEnv: 'OPENROUTER_API_KEY',
        isEnabled: true,
        defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
        maxTokens: 8192
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        apiKeyEnv: 'OPENAI_API_KEY',
        isEnabled: true,
        defaultModel: 'gpt-4o-mini',
        maxTokens: 16384
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        isEnabled: true,
        defaultModel: 'deepseek-chat',
        maxTokens: 8192
    },
    claude: {
        id: 'claude',
        name: 'Claude',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        apiKeyEnv: 'ANTHROPIC_API_KEY',
        isEnabled: true,
        defaultModel: 'claude-3-5-sonnet-20241022',
        maxTokens: 8192
    },
    gemini: {
        id: 'gemini',
        name: 'Gemini',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
        apiKeyEnv: 'GOOGLE_GEMINI_API_KEY',
        isEnabled: true,
        defaultModel: 'gemini-1.5-flash',
        maxTokens: 8192
    },
    custom: {
        id: 'custom',
        name: 'Custom API',
        apiEndpoint: '', // User-defined
        apiKeyEnv: '', // User-defined
        isEnabled: true,
        defaultModel: '',
        maxTokens: 8192
    }
}

// ============================================================================
// Capabilities
// ============================================================================

export type CapabilityId =
    | 'basic-search'
    | 'full-search'
    | 'file-upload'
    | 'reasoning'
    | 'custom-api'

export interface CapabilityConfig {
    id: CapabilityId
    name: string
    description: string
    isEnabled: boolean
}

// ============================================================================
// Messages
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface ChatMessageContent {
    role: MessageRole
    content: string
    timestamp: Date
    tool_call_id?: string // For tool responses
    metadata?: {
        model?: string
        provider?: ProviderId
        tokensUsed?: number
        searchResults?: SearchResult[]
        files?: FileAttachment[]
        toolCalls?: ToolCall[] // For assistant messages requesting tools
        toolResult?: any
    }
}

export interface ToolDescriptor {
    type: 'function'
    function: {
        name: string
        description?: string
        parameters: any
    }
}

export interface ToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}

export interface ToolResponse {
    tool_call_id: string
    content: string
}

export interface SearchResult {
    title: string
    url: string
    snippet: string
}

export interface FileAttachment {
    id: string
    name: string
    type: string
    size: number
    extractedText?: string
}

// ============================================================================
// Chat Session
// ============================================================================

export interface ChatSession {
    id: string
    userId: string
    personaId?: string
    messages: ChatMessageContent[]
    provider: ProviderId
    createdAt: Date
    updatedAt: Date
}

// ============================================================================
// API Request/Response
// ============================================================================

export interface ChatRequest {
    messages: ChatMessageContent[]
    personaId?: string
    systemPrompt?: string
    preferredProvider?: ProviderId // Only used if tier allows
    enableSearch?: boolean
    files?: FileAttachment[]
}

export interface ChatResponse {
    content: string
    provider: ProviderId
    model: string
    tokensUsed: number
    searchResults?: SearchResult[]
}

export interface ChatChunk {
    content?: string
    toolCalls?: ToolCall[]
    done?: boolean
}

// ============================================================================
// Provider Interface
// ============================================================================

export interface IChatProvider {
    id: ProviderId
    name: string

    /**
     * Send a chat completion request and stream the response
     */
    sendMessage(
        messages: ChatMessageContent[],
        systemPrompt: string,
        options: ProviderOptions
    ): AsyncGenerator<ChatChunk, void, unknown>

    /**
     * Check if this provider is available (API key exists, enabled, etc.)
     */
    isAvailable(): boolean

    /**
     * Get estimated token count for messages
     */
    estimateTokens(messages: ChatMessageContent[]): number
}

export interface ProviderOptions {
    temperature?: number
    maxTokens?: number
    model?: string
    abortSignal?: AbortSignal
    tools?: ToolDescriptor[]
}

// ============================================================================
// Capability Interface
// ============================================================================

export interface IChatCapability {
    id: CapabilityId
    name: string

    /**
     * Process input before sending to provider
     */
    preProcess?(
        messages: ChatMessageContent[],
        context: CapabilityContext
    ): Promise<ChatMessageContent[]>

    /**
     * Process output after receiving from provider
     */
    postProcess?(
        response: string,
        context: CapabilityContext
    ): Promise<string>

    /**
     * Check if this capability is available
     */
    isAvailable(): boolean
}

export interface CapabilityContext {
    userTier: UserTier
    searchEnabled: boolean
    files: FileAttachment[]
}
