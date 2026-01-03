/**
 * Search Manager
 * 
 * Coordinates search providers and handles fallback logic with:
 * - Circuit breaker pattern for failing providers
 * - Rate limiting per provider
 * - Automatic failover
 */

import {
    ISearchProvider,
    SearchProviderId,
    SearchResult,
    SearchResponse
} from './types'
import { tavilyProvider } from './tavily'
import { googleProvider } from './google'
import { braveProvider } from './brave'
import { duckduckgoProvider } from './duckduckgo'

// ============================================================================
// Circuit Breaker
// ============================================================================

interface CircuitBreakerState {
    failures: number
    lastFailure: number
    state: 'closed' | 'open' | 'half-open'
}

const CIRCUIT_BREAKER_THRESHOLD = 3 // failures before opening
const CIRCUIT_BREAKER_TIMEOUT = 60000 // 1 minute before trying again

class CircuitBreaker {
    private states = new Map<SearchProviderId, CircuitBreakerState>()

    getState(providerId: SearchProviderId): CircuitBreakerState {
        if (!this.states.has(providerId)) {
            this.states.set(providerId, {
                failures: 0,
                lastFailure: 0,
                state: 'closed'
            })
        }
        return this.states.get(providerId)!
    }

    canAttempt(providerId: SearchProviderId): boolean {
        const state = this.getState(providerId)

        if (state.state === 'closed') return true

        // Check if timeout has passed
        if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
            state.state = 'half-open'
            return true
        }

        return false
    }

    recordSuccess(providerId: SearchProviderId): void {
        const state = this.getState(providerId)
        state.failures = 0
        state.state = 'closed'
    }

    recordFailure(providerId: SearchProviderId): void {
        const state = this.getState(providerId)
        state.failures++
        state.lastFailure = Date.now()

        if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
            state.state = 'open'
            console.warn(`🔴 [CircuitBreaker] ${providerId} circuit opened after ${state.failures} failures`)
        }
    }
}

// ============================================================================
// Rate Limiter
// ============================================================================

interface RateLimitState {
    requests: number[]
}

const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // per provider per minute

class RateLimiter {
    private states = new Map<SearchProviderId, RateLimitState>()

    getState(providerId: SearchProviderId): RateLimitState {
        if (!this.states.has(providerId)) {
            this.states.set(providerId, { requests: [] })
        }
        return this.states.get(providerId)!
    }

    canRequest(providerId: SearchProviderId): boolean {
        const state = this.getState(providerId)
        const now = Date.now()

        // Remove old requests outside the window
        state.requests = state.requests.filter(time => now - time < RATE_LIMIT_WINDOW)

        return state.requests.length < RATE_LIMIT_MAX_REQUESTS
    }

    recordRequest(providerId: SearchProviderId): void {
        const state = this.getState(providerId)
        state.requests.push(Date.now())
    }
}

// ============================================================================
// Search Manager
// ============================================================================

// Registry of all search providers (priority order)
const SEARCH_PROVIDERS: ISearchProvider[] = [
    tavilyProvider,      // Primary - best quality, paid
    googleProvider,      // Secondary - high quality, paid
    braveProvider,       // Tertiary - good quality, paid
    duckduckgoProvider   // Fallback - always available, free
]

export class SearchManager {
    private providers: ISearchProvider[]
    private circuitBreaker: CircuitBreaker
    private rateLimiter: RateLimiter

    constructor() {
        this.providers = SEARCH_PROVIDERS
        this.circuitBreaker = new CircuitBreaker()
        this.rateLimiter = new RateLimiter()
    }

    /**
     * Get list of available search providers
     */
    getAvailableProviders(): ISearchProvider[] {
        return this.providers.filter(p => {
            const isConfigured = p.isAvailable()
            const canAttempt = this.circuitBreaker.canAttempt(p.id)
            const canRequest = this.rateLimiter.canRequest(p.id)

            return isConfigured && canAttempt && canRequest
        })
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

                // Record rate limit
                this.rateLimiter.recordRequest(provider.id)

                const results = await provider.search(query, maxResults)

                // Record success
                this.circuitBreaker.recordSuccess(provider.id)

                console.log(`✅ [SearchManager] Got ${results.length} results from ${provider.name}`)

                return {
                    query,
                    results,
                    provider: provider.id,
                    timestamp: new Date()
                }
            } catch (error) {
                console.error(`❌ [SearchManager] ${provider.name} failed:`, error)

                // Record failure
                this.circuitBreaker.recordFailure(provider.id)
                lastError = error as Error

                // Continue to next provider
            }
        }

        // All providers failed
        console.error('[SearchManager] All providers failed, returning empty results')
        return {
            query,
            results: [],
            provider: available[0]?.id || 'duckduckgo',
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

        if (!this.circuitBreaker.canAttempt(providerId)) {
            throw new Error(`Search provider ${providerId} circuit breaker is open`)
        }

        if (!this.rateLimiter.canRequest(providerId)) {
            throw new Error(`Search provider ${providerId} rate limit exceeded`)
        }

        this.rateLimiter.recordRequest(providerId)

        try {
            const results = await provider.search(query, maxResults)
            this.circuitBreaker.recordSuccess(providerId)

            return {
                query,
                results,
                provider: providerId,
                timestamp: new Date()
            }
        } catch (error) {
            this.circuitBreaker.recordFailure(providerId)
            throw error
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
    getProviderStatus(): Record<SearchProviderId, { available: boolean; circuitState: string; configured: boolean }> {
        const status: Partial<Record<SearchProviderId, { available: boolean; circuitState: string; configured: boolean }>> = {}

        for (const provider of this.providers) {
            const circuitState = this.circuitBreaker.getState(provider.id)
            status[provider.id] = {
                configured: provider.isAvailable(),
                circuitState: circuitState.state,
                available: provider.isAvailable() && this.circuitBreaker.canAttempt(provider.id) && this.rateLimiter.canRequest(provider.id)
            }
        }

        return status as Record<SearchProviderId, { available: boolean; circuitState: string; configured: boolean }>
    }
}

// Export singleton instance
export const searchManager = new SearchManager()

// Export individual providers for direct use
export { tavilyProvider } from './tavily'
export { googleProvider } from './google'
export { braveProvider } from './brave'
export { duckduckgoProvider } from './duckduckgo'
