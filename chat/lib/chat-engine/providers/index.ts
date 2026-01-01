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
    ProviderOptions
} from '../types'
import { openrouterProvider } from './openrouter'
import { deepseekProvider } from './deepseek'
import { claudeProvider } from './claude'
import { geminiProvider } from './gemini'

// Registry of all available providers
const PROVIDERS: Record<ProviderId, IChatProvider> = {
    openrouter: openrouterProvider, // FREE default
    deepseek: deepseekProvider,
    claude: claudeProvider,
    gemini: geminiProvider,
    custom: null as any // Will be initialized per-user for enterprise
}

export class ProviderManager {
    private userTier: UserTier
    private preferredProvider?: ProviderId

    constructor(userTier: UserTier, preferredProvider?: ProviderId) {
        this.userTier = userTier
        this.preferredProvider = preferredProvider
    }

    /**
     * Get list of providers available to this user's tier
     */
    getAvailableProviders(): IChatProvider[] {
        const tierConfig = TIER_CONFIGS[this.userTier]
        const available: IChatProvider[] = []

        for (const providerId of tierConfig.allowedProviders) {
            const provider = PROVIDERS[providerId]
            if (provider && provider.isAvailable()) {
                available.push(provider)
            }
        }

        return available
    }

    /**
     * Get the best provider for this user
     * Priority: preferred > first available by tier
     */
    getProvider(): IChatProvider {
        const tierConfig = TIER_CONFIGS[this.userTier]

        // If user has a preferred provider and it's allowed for their tier
        if (this.preferredProvider && tierConfig.allowedProviders.includes(this.preferredProvider)) {
            const preferred = PROVIDERS[this.preferredProvider]
            if (preferred && preferred.isAvailable()) {
                return preferred
            }
        }

        // Fall back to first available provider for this tier
        for (const providerId of tierConfig.allowedProviders) {
            const provider = PROVIDERS[providerId]
            if (provider && provider.isAvailable()) {
                return provider
            }
        }

        // Should never happen, but fallback to DeepSeek
        throw new Error('No available chat providers configured')
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
    async *sendMessage(
        messages: ChatMessageContent[],
        systemPrompt: string,
        options: ProviderOptions = {}
    ): AsyncGenerator<string, void, unknown> {
        const provider = this.getProvider()

        console.log(`🤖 [ChatEngine] Using provider: ${provider.name} for ${this.userTier} tier`)

        yield* provider.sendMessage(messages, systemPrompt, options)
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
    preferredProvider?: ProviderId
): ProviderManager {
    return new ProviderManager(userTier, preferredProvider)
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
