/**
 * Brave Search Provider
 * 
 * Uses Brave Search API
 * Requires BRAVE_SEARCH_API_KEY
 */

import { BaseSearchProvider } from './base'
import {
    SearchProviderId,
    SearchResult,
    SEARCH_PROVIDER_CONFIGS
} from './types'

export class BraveProvider extends BaseSearchProvider {
    id: SearchProviderId = 'brave'
    name = 'Brave Search'

    constructor() {
        super(SEARCH_PROVIDER_CONFIGS.brave)
    }

    /**
     * Perform Brave search
     */
    async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
        const apiKey = this.getApiKey()
        if (!apiKey) {
            throw new Error('Brave Search API key not configured')
        }

        try {
            const url = new URL(this.config.apiEndpoint)
            url.searchParams.set('q', query)
            url.searchParams.set('count', maxResults.toString())

            const response = await fetch(url.toString(), {
                headers: {
                    'Accept': 'application/json',
                    'X-Subscription-Token': apiKey
                }
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(`Brave API error: ${response.status} - ${error.message || 'Unknown'}`)
            }

            const data = await response.json()

            if (!data.web || !data.web.results || !Array.isArray(data.web.results)) {
                return []
            }

            return data.web.results.map((result: any) => ({
                title: result.title || 'Untitled',
                url: result.url || '',
                snippet: result.description || '',
                source: 'brave'
            })).slice(0, maxResults)
        } catch (error) {
            console.error('[Brave] Search failed:', error)
            throw error
        }
    }
}

export const braveProvider = new BraveProvider()
