/**
 * Provider Manager
 * 
 * Handles provider selection based on user tier
 * Central point for all provider operations
 */

import {
    IChatProvider,
    ProviderId,
    UserTier,
    TIER_CONFIGS,
    ChatMessageContent,
    ProviderOptions,
    ChatChunk,
    LLMConfig
} from '../types'
import { openrouterProvider } from './openrouter'
import { openaiProvider } from './openai'
import { deepseekProvider } from './deepseek'
import { claudeProvider } from './claude'
import { geminiProvider } from './gemini'

// Registry of all available providers
const PROVIDERS: Record<ProviderId, IChatProvider> = {
    openrouter: openrouterProvider, // FREE default
    openai: openaiProvider,
    deepseek: deepseekProvider,
    claude: claudeProvider,
    gemini: geminiProvider,
    custom: null as any, // Will be initialized per-user for enterprise
    anthropic: null as any,
    mistral: null as any,
    perplexity: null as any,
    groq: null as any
}

export class ProviderManager {
    private userTier: UserTier
    private preferredProvider?: ProviderId
    private dynamicConfig?: LLMConfig[]

    constructor(userTier: UserTier, preferredProvider?: ProviderId, dynamicConfig?: LLMConfig[]) {
        this.userTier = userTier
        this.preferredProvider = preferredProvider
        this.dynamicConfig = dynamicConfig
    }

    /**
     * Get list of providers available to this user's tier
     * Filters out providers disabled in dynamic config
     */
    getAvailableProviders(): IChatProvider[] {
        const tierConfig = TIER_CONFIGS[this.userTier]
        const available: IChatProvider[] = []

        // Create a map of enabled status from dynamic config
        const configMap = new Map<string, boolean>()
        if (this.dynamicConfig) {
            this.dynamicConfig.forEach(c => {
                configMap.set(c.provider, c.is_enabled)
            })
        }

        for (const providerId of tierConfig.allowedProviders) {
            // Check dynamic config if available
            if (this.dynamicConfig) {
                const config = this.dynamicConfig.find(c => c.provider === providerId || c.model_id.startsWith(providerId))
                if (config && !config.is_enabled) {
                    continue // Skip if explicitly disabled
                }
            }

            const provider = PROVIDERS[providerId]
            if (provider && provider.isAvailable()) {
                available.push(provider)
            }
        }

        return available
    }

    /**
     * Get the best provider for this user
     * Priority: preferred > first available by tier (respecting dynamic config)
     */
    getProvider(): IChatProvider {
        const tierConfig = TIER_CONFIGS[this.userTier]

        // Create a map of enabled status from dynamic config
        const configMap = new Map<string, boolean>()
        if (this.dynamicConfig) {
            this.dynamicConfig.forEach(c => {
                configMap.set(c.provider, c.is_enabled)
            })
        }

        // Helper to check if enabled
        const isEnabled = (pid: ProviderId) => {
            if (!this.dynamicConfig) return true

            // Find config for this provider
            // We match against the 'provider' field in LLMConfig which should correspond to ProviderId
            const config = this.dynamicConfig.find(c => c.provider === pid || c.model_id.startsWith(pid))

            if (config) {
                return config.is_enabled
            }

            return true // Default to true if no specific config found
        }

        // If user has a preferred provider and it's allowed for their tier
        if (this.preferredProvider && tierConfig.allowedProviders.includes(this.preferredProvider)) {
            const preferred = PROVIDERS[this.preferredProvider]
            if (preferred && preferred.isAvailable() && isEnabled(this.preferredProvider)) {
                return preferred
            }
        }

        // Fall back to first available provider for this tier
        for (const providerId of tierConfig.allowedProviders) {
            const provider = PROVIDERS[providerId]
            if (provider && provider.isAvailable() && isEnabled(providerId)) {
                return provider
            }
        }

        // EXPLICIT FALLBACK: If nothing else works, force DeepSeek
        // This prevents the 500 error when config is messed up
        console.warn('[ProviderManager] No providers found via config. Forcing DeepSeek fallback.')
        return PROVIDERS['deepseek']

        // throw new Error('No available chat providers configured')
    }

    /**
     * Check if user can use a specific provider
     */
    canUseProvider(providerId: ProviderId): boolean {
        const tierConfig = TIER_CONFIGS[this.userTier]
        return tierConfig.allowedProviders.includes(providerId)
    }

    /**
     * Send message using the best available provider
     */
    async * sendMessage(
        messages: ChatMessageContent[],
        systemPrompt: string,
        options: ProviderOptions = {}
    ): AsyncGenerator<ChatChunk, void, unknown> {
        const provider = this.getProvider()

        console.log(`🤖 [ChatEngine] Using provider: ${provider.name} for ${this.userTier} tier`)

        yield* provider.sendMessage(messages, systemPrompt, options)
    }

    /**
     * Estimate tokens for prompt (messages + system prompt)
     */
    estimatePromptTokens(messages: ChatMessageContent[], systemPrompt: string): number {
        const provider = this.getProvider()
        const totalChars = messages.reduce((sum, msg) => sum + (msg.content?.length || 0), 0) + (systemPrompt?.length || 0)
        return Math.ceil(totalChars / 4)
    }

    /**
     * Get provider info for response metadata
     */
    getProviderInfo(): { id: ProviderId; name: string } {
        const provider = this.getProvider()
        return { id: provider.id, name: provider.name }
    }
}

/**
 * Factory function to create a provider manager for a user
 */
export function createProviderManager(
    userTier: UserTier,
    preferredProvider?: ProviderId,
    dynamicConfig?: LLMConfig[]
): ProviderManager {
    return new ProviderManager(userTier, preferredProvider, dynamicConfig)
}

/**
 * Get provider by ID (for admin/debugging)
 */
export function getProviderById(id: ProviderId): IChatProvider | null {
    return PROVIDERS[id] || null
}

/**
 * Check which providers are currently available (have API keys)
 */
export function getSystemProviderStatus(): Record<ProviderId, boolean> {
    const status: Record<ProviderId, boolean> = {} as any

    for (const [id, provider] of Object.entries(PROVIDERS)) {
        if (provider) {
            status[id as ProviderId] = provider.isAvailable()
        } else {
            status[id as ProviderId] = false
        }
    }

    return status
}
