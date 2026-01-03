/**
 * Search Capability - Types
 * 
 * Modular search providers for web search functionality
 */

// ============================================================================
// Search Result Types
// ============================================================================

export interface SearchResult {
    title: string
    url: string
    snippet: string
    source?: string
}

export interface SearchResponse {
    query: string
    results: SearchResult[]
    provider: SearchProviderId
    timestamp: Date
}

// ============================================================================
// Search Provider Types
// ============================================================================

export type SearchProviderId = 'tavily' | 'duckduckgo' | 'google' | 'brave' | 'serper'

export interface SearchProviderConfig {
    id: SearchProviderId
    name: string
    apiEndpoint: string
    apiKeyEnv: string
    isEnabled: boolean
    maxResults: number
}

export const SEARCH_PROVIDER_CONFIGS: Record<SearchProviderId, SearchProviderConfig> = {
    tavily: {
        id: 'tavily',
        name: 'Tavily',
        apiEndpoint: 'https://api.tavily.com/search',
        apiKeyEnv: 'TAVILY_API_KEY',
        isEnabled: true,
        maxResults: 5
    },
    duckduckgo: {
        id: 'duckduckgo',
        name: 'DuckDuckGo',
        apiEndpoint: 'https://api.duckduckgo.com/',
        apiKeyEnv: '', // No API key needed
        isEnabled: true,
        maxResults: 5
    },
    google: {
        id: 'google',
        name: 'Google Custom Search',
        apiEndpoint: 'https://www.googleapis.com/customsearch/v1',
        apiKeyEnv: 'GOOGLE_SEARCH_API_KEY',
        isEnabled: true,
        maxResults: 5
    },
    brave: {
        id: 'brave',
        name: 'Brave Search',
        apiEndpoint: 'https://api.search.brave.com/res/v1/web/search',
        apiKeyEnv: 'BRAVE_SEARCH_API_KEY',
        isEnabled: true,
        maxResults: 5
    },
    serper: {
        id: 'serper',
        name: 'Serper',
        apiEndpoint: 'https://google.serper.dev/search',
        apiKeyEnv: 'SERPER_API_KEY',
        isEnabled: true,
        maxResults: 5
    }
}

// ============================================================================
// Search Provider Interface
// ============================================================================

export interface ISearchProvider {
    id: SearchProviderId
    name: string

    /**
     * Perform a web search
     */
    search(query: string, maxResults?: number): Promise<SearchResult[]>

    /**
     * Check if this provider is available (API key exists, etc.)
     */
    isAvailable(): boolean
}
