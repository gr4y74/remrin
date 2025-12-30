/**
 * Model Configuration Module
 * 
 * Centralized LLM provider configuration and routing.
 * Supports dynamic model switching based on database config and user preferences.
 * 
 * Note: Uses untyped Supabase client for llm_config table since it's a new migration
 * that may not be in the generated types yet. Run 'npm run supabase:types' to regenerate.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Provider types supported by the system
export type LLMProvider =
    | 'deepseek'
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'groq'
    | 'mistral'
    | 'perplexity'

// Model configuration for API calls
export interface ModelConfig {
    provider: LLMProvider
    modelId: string
    displayName: string
    baseURL: string
    apiKeyEnvVar: string
    supportsTools: boolean
    supportsStreaming: boolean
    supportsVision: boolean
    maxTokens: number
    webSearchEnabled: boolean
}

// Provider-specific configurations
const PROVIDER_CONFIGS: Record<LLMProvider, Omit<ModelConfig, 'modelId' | 'displayName' | 'webSearchEnabled'>> = {
    deepseek: {
        provider: 'deepseek',
        baseURL: 'https://api.deepseek.com',
        apiKeyEnvVar: 'DEEPSEEK_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: false,
        maxTokens: 4096
    },
    openai: {
        provider: 'openai',
        baseURL: 'https://api.openai.com/v1',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: true,
        maxTokens: 4096
    },
    anthropic: {
        provider: 'anthropic',
        baseURL: 'https://api.anthropic.com',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: true,
        maxTokens: 4096
    },
    google: {
        provider: 'google',
        baseURL: 'https://generativelanguage.googleapis.com',
        apiKeyEnvVar: 'GOOGLE_GEMINI_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: true,
        maxTokens: 8192
    },
    groq: {
        provider: 'groq',
        baseURL: 'https://api.groq.com/openai/v1',
        apiKeyEnvVar: 'GROQ_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: false,
        maxTokens: 8192
    },
    mistral: {
        provider: 'mistral',
        baseURL: 'https://api.mistral.ai/v1',
        apiKeyEnvVar: 'MISTRAL_API_KEY',
        supportsTools: true,
        supportsStreaming: true,
        supportsVision: false,
        maxTokens: 4096
    },
    perplexity: {
        provider: 'perplexity',
        baseURL: 'https://api.perplexity.ai',
        apiKeyEnvVar: 'PERPLEXITY_API_KEY',
        supportsTools: false,
        supportsStreaming: true,
        supportsVision: false,
        maxTokens: 4096
    }
}

// Database record type
interface LLMConfigRecord {
    id: string
    provider: LLMProvider
    model_id: string
    display_name: string
    is_default: boolean
    is_enabled: boolean
    requires_premium: boolean
    web_search_enabled: boolean
    priority: number
    config: Record<string, unknown>
}

/**
 * Get the system's default active model configuration
 * Reads from llm_config table
 */
export async function getActiveModelConfig(): Promise<ModelConfig> {
    // Use untyped client for llm_config (new table)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: config, error } = await supabase
        .from('llm_config')
        .select('*')
        .eq('is_default', true)
        .eq('is_enabled', true)
        .single()

    if (error || !config) {
        console.warn('[ModelConfig] No default config found, using DeepSeek fallback')
        return getModelConfigByProvider('deepseek', 'deepseek-chat')
    }

    return buildModelConfig(config as LLMConfigRecord)
}

/**
 * Get model configuration for a specific provider and model ID
 */
export function getModelConfigByProvider(provider: LLMProvider, modelId: string): ModelConfig {
    const providerConfig = PROVIDER_CONFIGS[provider]
    if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`)
    }

    return {
        ...providerConfig,
        modelId,
        displayName: modelId,
        webSearchEnabled: true
    }
}

/**
 * Get user's preferred model configuration
 * Falls back to system default if user has no preference
 */
export async function getUserModelPreference(userId: string): Promise<ModelConfig> {
    // Use untyped client for new columns
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user has a preference (new columns may not be in types)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')  // Select all to avoid column errors
        .eq('user_id', userId)
        .single() as { data: any }

    // Admin override takes precedence
    if (profile?.model_override) {
        const [provider, ...modelParts] = profile.model_override.split(':')
        const modelId = modelParts.join(':') || profile.model_override
        return getModelConfigByProvider(provider as LLMProvider || 'deepseek', modelId)
    }

    // User preference
    if (profile?.preferred_model) {
        // Look up the model in llm_config
        const { data: modelConfig } = await supabase
            .from('llm_config')
            .select('*')
            .eq('model_id', profile.preferred_model)
            .eq('is_enabled', true)
            .single()

        if (modelConfig) {
            return buildModelConfig(modelConfig as LLMConfigRecord)
        }
    }

    // Fall back to system default
    return getActiveModelConfig()
}

/**
 * Get all enabled models (for model selector UI)
 */
export async function getAvailableModels(isPremiumUser: boolean = false): Promise<ModelConfig[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase
        .from('llm_config')
        .select('*')
        .eq('is_enabled', true)
        .order('priority', { ascending: false })

    if (!isPremiumUser) {
        query = query.eq('requires_premium', false)
    }

    const { data: models, error } = await query

    if (error || !models) {
        console.error('[ModelConfig] Error fetching models:', error)
        return [getModelConfigByProvider('deepseek', 'deepseek-chat')]
    }

    return (models as LLMConfigRecord[]).map(m => buildModelConfig(m))
}

/**
 * Set the system default model (admin only)
 */
export async function setDefaultModel(modelId: string): Promise<boolean> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // First, unset all defaults
    await supabase
        .from('llm_config')
        .update({ is_default: false })
        .neq('id', 'placeholder')

    // Set the new default
    const { error } = await supabase
        .from('llm_config')
        .update({ is_default: true })
        .eq('model_id', modelId)

    if (error) {
        console.error('[ModelConfig] Error setting default:', error)
        return false
    }

    return true
}

/**
 * Get API key for a provider from environment
 */
export function getApiKeyForProvider(provider: LLMProvider): string {
    const config = PROVIDER_CONFIGS[provider]
    const key = process.env[config.apiKeyEnvVar]

    if (!key) {
        throw new Error(`API key not configured for provider: ${provider}`)
    }

    return key
}

/**
 * Get the API endpoint path for a provider
 */
export function getApiEndpointForProvider(provider: LLMProvider): string {
    const endpoints: Record<LLMProvider, string> = {
        deepseek: '/api/chat/openai', // Uses OpenAI-compatible endpoint
        openai: '/api/chat/openai',
        anthropic: '/api/chat/anthropic',
        google: '/api/chat/google',
        groq: '/api/chat/groq',
        mistral: '/api/chat/mistral',
        perplexity: '/api/chat/perplexity'
    }
    return endpoints[provider]
}

/**
 * Build ModelConfig from database record
 */
function buildModelConfig(record: LLMConfigRecord): ModelConfig {
    const providerConfig = PROVIDER_CONFIGS[record.provider]
    return {
        ...providerConfig,
        modelId: record.model_id,
        displayName: record.display_name,
        webSearchEnabled: record.web_search_enabled
    }
}

/**
 * Check if a provider requires special handling (non-OpenAI compatible)
 */
export function requiresSpecialHandling(provider: LLMProvider): boolean {
    return ['anthropic', 'google'].includes(provider)
}
