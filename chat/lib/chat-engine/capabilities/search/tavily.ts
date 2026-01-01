/**
 * Tavily Search Provider
 * 
 * Primary search provider - best quality results
 * Requires TAVILY_API_KEY
 */

import { BaseSearchProvider } from './base'
import {
    SearchProviderId,
    SearchResult,
    SEARCH_PROVIDER_CONFIGS
} from './types'

export class TavilyProvider extends BaseSearchProvider {
    id: SearchProviderId = 'tavily'
    name = 'Tavily'

    constructor() {
        super(SEARCH_PROVIDER_CONFIGS.tavily)
    }

    /**
     * Perform Tavily search
     */
    async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
        const apiKey = this.getApiKey()
        if (!apiKey) {
            throw new Error('Tavily API key not configured')
        }

        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    query: query,
                    max_results: maxResults,
                    include_answer: false,
                    include_raw_content: false
                })
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(`Tavily API error: ${response.status} - ${error.detail || 'Unknown'}`)
            }

            const data = await response.json()

            return (data.results || []).map((result: any) => ({
                title: result.title || 'Untitled',
                url: result.url || '',
                snippet: result.content || result.snippet || '',
                source: 'tavily'
            }))
        } catch (error) {
            console.error('[Tavily] Search failed:', error)
            throw error
        }
    }
}

export const tavilyProvider = new TavilyProvider()
