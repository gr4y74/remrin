/**
 * Google Custom Search Provider
 * 
 * Uses Google Custom Search JSON API
 * Requires GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID
 */

import { BaseSearchProvider } from './base'
import {
    SearchProviderId,
    SearchResult,
    SEARCH_PROVIDER_CONFIGS
} from './types'

export class GoogleProvider extends BaseSearchProvider {
    id: SearchProviderId = 'google'
    name = 'Google Custom Search'

    constructor() {
        super(SEARCH_PROVIDER_CONFIGS.google)
    }

    /**
     * Google needs both API key and Search Engine ID
     */
    isAvailable(): boolean {
        if (!this.config.isEnabled) return false
        const apiKey = this.getApiKey()
        const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID
        return !!(apiKey && apiKey.length > 0 && engineId && engineId.length > 0)
    }

    /**
     * Perform Google Custom Search
     */
    async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
        const apiKey = this.getApiKey()
        const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID

        if (!apiKey || !engineId) {
            throw new Error('Google Custom Search API key or Engine ID not configured')
        }

        try {
            const url = new URL(this.config.apiEndpoint)
            url.searchParams.set('key', apiKey)
            url.searchParams.set('cx', engineId)
            url.searchParams.set('q', query)
            url.searchParams.set('num', Math.min(maxResults, 10).toString()) // Google max is 10

            const response = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(`Google API error: ${response.status} - ${error.error?.message || 'Unknown'}`)
            }

            const data = await response.json()

            if (!data.items || !Array.isArray(data.items)) {
                return []
            }

            return data.items.map((item: any) => ({
                title: item.title || 'Untitled',
                url: item.link || '',
                snippet: item.snippet || '',
                source: 'google'
            })).slice(0, maxResults)
        } catch (error) {
            console.error('[Google] Search failed:', error)
            throw error
        }
    }
}

export const googleProvider = new GoogleProvider()
