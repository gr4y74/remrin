/**
 * Search Manager
 * 
 * Coordinates search providers and handles fallback logic
 */

import {
    ISearchProvider,
    SearchProviderId,
    SearchResult,
    SearchResponse
} from './types'
import { tavilyProvider } from './tavily'
import { duckduckgoProvider } from './duckduckgo'

// Registry of all search providers (priority order)
const SEARCH_PROVIDERS: ISearchProvider[] = [
    tavilyProvider,      // Primary - best quality
    duckduckgoProvider   // Fallback - always available, free
]

export class SearchManager {
    private providers: ISearchProvider[]

    constructor() {
        this.providers = SEARCH_PROVIDERS
    }

    /**
     * Get list of available search providers
     */
    getAvailableProviders(): ISearchProvider[] {
        return this.providers.filter(p => p.isAvailable())
    }

    /**
     * Get the best available provider
     */
    getBestProvider(): ISearchProvider | null {
        const available = this.getAvailableProviders()
        return available.length > 0 ? available[0] : null
    }

    /**
     * Perform search using best available provider with fallback
     */
    async search(query: string, maxResults: number = 5): Promise<SearchResponse> {
        const available = this.getAvailableProviders()

        if (available.length === 0) {
            console.warn('[SearchManager] No search providers available')
            return {
                query,
                results: [],
                provider: 'duckduckgo', // Default
                timestamp: new Date()
            }
        }

        let lastError: Error | null = null

        // Try each provider in order until one succeeds
        for (const provider of available) {
            try {
                console.log(`🔍 [SearchManager] Searching with ${provider.name}...`)
                const results = await provider.search(query, maxResults)

                console.log(`✅ [SearchManager] Got ${results.length} results from ${provider.name}`)

                return {
                    query,
                    results,
                    provider: provider.id,
                    timestamp: new Date()
                }
            } catch (error) {
                console.error(`❌ [SearchManager] ${provider.name} failed:`, error)
                lastError = error as Error
                // Continue to next provider
            }
        }

        // All providers failed
        console.error('[SearchManager] All providers failed, returning empty results')
        return {
            query,
            results: [],
            provider: 'duckduckgo',
            timestamp: new Date()
        }
    }

    /**
     * Search with a specific provider
     */
    async searchWithProvider(
        query: string,
        providerId: SearchProviderId,
        maxResults: number = 5
    ): Promise<SearchResponse> {
        const provider = this.providers.find(p => p.id === providerId)

        if (!provider) {
            throw new Error(`Search provider ${providerId} not found`)
        }

        if (!provider.isAvailable()) {
            throw new Error(`Search provider ${providerId} is not available`)
        }

        const results = await provider.search(query, maxResults)

        return {
            query,
            results,
            provider: providerId,
            timestamp: new Date()
        }
    }

    /**
     * Format search results for AI consumption
     */
    formatForAI(response: SearchResponse): string {
        if (response.results.length === 0) {
            return `No web search results found for: "${response.query}"`
        }

        const formattedResults = response.results.map((r, i) =>
            `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.snippet}`
        ).join('\n\n')

        return `Web search results for "${response.query}":\n\n${formattedResults}`
    }

    /**
     * Check which providers are currently available
     */
    getProviderStatus(): Record<SearchProviderId, boolean> {
        const status: Partial<Record<SearchProviderId, boolean>> = {}

        for (const provider of this.providers) {
            status[provider.id] = provider.isAvailable()
        }

        return status as Record<SearchProviderId, boolean>
    }
}

// Export singleton instance
export const searchManager = new SearchManager()

// Export individual providers for direct use
export { tavilyProvider } from './tavily'
export { duckduckgoProvider } from './duckduckgo'
