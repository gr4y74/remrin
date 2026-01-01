/**
 * Base Search Provider
 * 
 * Abstract base class for all search providers
 */

import {
    ISearchProvider,
    SearchProviderId,
    SearchProviderConfig,
    SearchResult
} from './types'

export abstract class BaseSearchProvider implements ISearchProvider {
    abstract id: SearchProviderId
    abstract name: string
    protected config: SearchProviderConfig

    constructor(config: SearchProviderConfig) {
        this.config = config
    }

    /**
     * Get the API key from environment
     */
    protected getApiKey(): string | null {
        if (!this.config.apiKeyEnv) return null
        return process.env[this.config.apiKeyEnv] || null
    }

    /**
     * Check if provider is available
     */
    isAvailable(): boolean {
        if (!this.config.isEnabled) return false
        // DuckDuckGo doesn't need API key
        if (this.id === 'duckduckgo') return true
        const apiKey = this.getApiKey()
        return !!apiKey && apiKey.length > 0
    }

    /**
     * Perform search - must be implemented by subclass
     */
    abstract search(query: string, maxResults?: number): Promise<SearchResult[]>
}
