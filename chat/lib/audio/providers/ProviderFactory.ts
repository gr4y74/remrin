/**
 * ProviderFactory
 * 
 * Factory for creating and managing TTS provider instances.
 * Implements singleton pattern and provides centralized provider configuration.
 * 
 * Features:
 * - Lazy provider instantiation
 * - Singleton instances
 * - Default provider selection based on user tier
 * - Health checking before instantiation
 * - Centralized configuration management
 */

import { IAudioProvider } from './AudioProvider.interface';
import { EdgeTTSProvider, getEdgeTTSProvider } from './EdgeTTSProvider';
import { KokoroProvider, getKokoroProvider } from './KokoroProvider';
import { ElevenLabsProvider, getElevenLabsProvider } from './ElevenLabsProvider';
import { Qwen3TTSProvider, getQwen3TTSProvider } from './Qwen3TTSProvider';
import { VoiceProvider } from '@/types/audio';

// ============================================================================
// Types
// ============================================================================

export type UserTier = 'free' | 'premium' | 'enterprise';

export interface ProviderConfig {
    /** Provider name */
    name: VoiceProvider;
    /** Display name */
    displayName: string;
    /** Whether provider is available */
    available: boolean;
    /** Whether provider requires API key/auth */
    requiresAuth: boolean;
    /** Whether provider requires premium tier */
    requiresPremium: boolean;
    /** Provider priority (lower = higher priority) */
    priority: number;
    /** Provider description */
    description: string;
}

// ============================================================================
// Provider Factory
// ============================================================================

export class ProviderFactory {
    private static instance: ProviderFactory | null = null;
    private providers: Map<VoiceProvider, IAudioProvider> = new Map();
    private providerConfigs: Map<VoiceProvider, ProviderConfig> = new Map();

    private constructor() {
        this.initializeProviderConfigs();
    }

    /**
     * Get singleton instance
     */
    static getInstance(): ProviderFactory {
        if (!ProviderFactory.instance) {
            ProviderFactory.instance = new ProviderFactory();
        }
        return ProviderFactory.instance;
    }

    /**
     * Initialize provider configurations
     */
    private initializeProviderConfigs(): void {
        // Edge TTS - Free tier
        this.providerConfigs.set('edge', {
            name: 'edge',
            displayName: 'Edge TTS',
            available: true,
            requiresAuth: false,
            requiresPremium: false,
            priority: 2,
            description: 'Microsoft Edge TTS - High quality neural voices, completely free',
        });

        // Kokoro-82M - Free tier (if server is running)
        this.providerConfigs.set('kokoro', {
            name: 'kokoro',
            displayName: 'Kokoro-82M',
            available: true, // Checked on first use
            requiresAuth: false,
            requiresPremium: false,
            priority: 1, // Higher priority than Edge
            description: 'Kokoro-82M - Extremely high quality local TTS model',
        });

        // ElevenLabs - Premium tier
        this.providerConfigs.set('elevenlabs', {
            name: 'elevenlabs',
            displayName: 'ElevenLabs',
            available: !!process.env.ELEVENLABS_API_KEY,
            requiresAuth: true,
            requiresPremium: true,
            priority: 0, // Highest priority
            description: 'ElevenLabs - Ultra-realistic voice cloning and generation',
        });

        // Qwen3-TTS - Self-hosted voice cloning and design
        this.providerConfigs.set('qwen3', {
            name: 'qwen3',
            displayName: 'Qwen3-TTS',
            available: !!(process.env.QWEN_ENDPOINT || process.env.QWEN_API_KEY),
            requiresAuth: false, // Self-hosted doesn't need API key
            requiresPremium: false, // Available to all tiers (free when self-hosted)
            priority: 0, // Same priority as ElevenLabs for premium features
            description: 'Qwen3-TTS (Self-Hosted) - Voice cloning, voice design from descriptions, 10 languages, FREE',
        });
    }

    /**
     * Get a provider instance
     * @param type - Provider type
     * @returns Provider instance
     */
    getProvider(type: VoiceProvider): IAudioProvider {
        // Return cached instance if available
        if (this.providers.has(type)) {
            return this.providers.get(type)!;
        }

        // Create new provider instance
        const provider = this.createProvider(type);
        this.providers.set(type, provider);

        console.log(`[ProviderFactory] Initialized provider: ${type}`);

        return provider;
    }

    /**
     * Create a new provider instance
     * @param type - Provider type
     * @param config - Optional configuration
     * @returns New provider instance
     */
    private createProvider(type: VoiceProvider, config?: unknown): IAudioProvider {
        switch (type) {
            case 'edge':
                return getEdgeTTSProvider();

            case 'kokoro':
                return getKokoroProvider();

            case 'elevenlabs':
                return getElevenLabsProvider();

            case 'qwen3':
                return getQwen3TTSProvider();

            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }

    /**
     * Get default provider based on user tier
     * @param userTier - User subscription tier
     * @param preferredProvider - User's preferred provider (if any)
     * @returns Best available provider
     */
    async getDefaultProvider(
        userTier: UserTier = 'free',
        preferredProvider?: VoiceProvider
    ): Promise<IAudioProvider> {
        // If user has a preferred provider, try to use it
        if (preferredProvider) {
            const config = this.providerConfigs.get(preferredProvider);

            // Check if provider is available for user's tier
            if (config && (!config.requiresPremium || userTier !== 'free')) {
                // Check if provider is healthy
                const provider = this.getProvider(preferredProvider);
                const status = await provider.getStatus();

                if (status.available) {
                    console.log(`[ProviderFactory] Using preferred provider: ${preferredProvider}`);
                    return provider;
                }

                console.warn(`[ProviderFactory] Preferred provider ${preferredProvider} is unavailable, falling back...`);
            }
        }

        // Get available providers for user's tier
        const availableProviders = Array.from(this.providerConfigs.values())
            .filter(config => {
                // Filter by availability
                if (!config.available) return false;

                // Filter by tier requirement
                if (config.requiresPremium && userTier === 'free') return false;

                return true;
            })
            .sort((a, b) => a.priority - b.priority); // Sort by priority

        // Try providers in priority order
        for (const config of availableProviders) {
            try {
                const provider = this.getProvider(config.name);
                const status = await provider.getStatus();

                if (status.available) {
                    console.log(`[ProviderFactory] Selected provider: ${config.name} (tier: ${userTier})`);
                    return provider;
                }
            } catch (error) {
                console.warn(`[ProviderFactory] Provider ${config.name} health check failed:`, error);
            }
        }

        // Fallback to Edge TTS (always available)
        console.warn('[ProviderFactory] All preferred providers unavailable, falling back to Edge TTS');
        return this.getProvider('edge');
    }

    /**
     * List all available providers for a user tier
     * @param userTier - User subscription tier
     * @returns List of available provider configs
     */
    listAvailableProviders(userTier: UserTier = 'free'): ProviderConfig[] {
        return Array.from(this.providerConfigs.values())
            .filter(config => {
                // Filter by tier requirement
                if (config.requiresPremium && userTier === 'free') {
                    return false;
                }
                return true;
            })
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * Get provider configuration
     * @param type - Provider type
     * @returns Provider configuration
     */
    getProviderConfig(type: VoiceProvider): ProviderConfig | undefined {
        return this.providerConfigs.get(type);
    }

    /**
     * Check if a provider is available for a user tier
     * @param type - Provider type
     * @param userTier - User subscription tier
     * @returns Whether provider is available
     */
    isProviderAvailable(type: VoiceProvider, userTier: UserTier = 'free'): boolean {
        const config = this.providerConfigs.get(type);
        if (!config) return false;

        // Check tier requirements
        if (config.requiresPremium && userTier === 'free') {
            return false;
        }

        return config.available;
    }

    /**
     * Get all provider statuses
     * @returns Map of provider statuses
     */
    async getAllProviderStatuses(): Promise<Map<VoiceProvider, { healthy: boolean; message: string }>> {
        const statuses = new Map<VoiceProvider, { healthy: boolean; message: string }>();

        for (const [name] of this.providerConfigs) {
            try {
                const provider = this.getProvider(name);
                const status = await provider.getStatus();

                statuses.set(name, {
                    healthy: status.available,
                    message: status.message || 'Unknown',
                });
            } catch (error) {
                statuses.set(name, {
                    healthy: false,
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return statuses;
    }

    /**
     * Clear all cached provider instances (useful for testing)
     */
    clearCache(): void {
        this.providers.clear();
        console.log('[ProviderFactory] Provider cache cleared');
    }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get the singleton ProviderFactory instance
 */
export function getProviderFactory(): ProviderFactory {
    return ProviderFactory.getInstance();
}

/**
 * Get a provider instance
 */
export function getProvider(type: VoiceProvider): IAudioProvider {
    return getProviderFactory().getProvider(type);
}

/**
 * Get default provider for user tier
 */
export async function getDefaultProvider(
    userTier: UserTier = 'free',
    preferredProvider?: VoiceProvider
): Promise<IAudioProvider> {
    return getProviderFactory().getDefaultProvider(userTier, preferredProvider);
}

export default ProviderFactory;
