/**
 * DuckDuckGo Search Provider
 * 
 * FREE fallback search - no API key required
 * Uses DuckDuckGo Instant Answer API
 */

import { BaseSearchProvider } from './base'
import {
    SearchProviderId,
    SearchResult,
    SEARCH_PROVIDER_CONFIGS
} from './types'

export class DuckDuckGoProvider extends BaseSearchProvider {
    id: SearchProviderId = 'duckduckgo'
    name = 'DuckDuckGo'

    constructor() {
        super(SEARCH_PROVIDER_CONFIGS.duckduckgo)
    }

    /**
     * DuckDuckGo doesn't need API key
     */
    isAvailable(): boolean {
        return this.config.isEnabled
    }

    /**
     * Perform DuckDuckGo search using Instant Answer API
     */
    async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
        try {
            // DuckDuckGo Instant Answer API
            const url = `${this.config.apiEndpoint}?q=${encodeURIComponent(query)}&format=json&no_redirect=1`

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`DuckDuckGo API error: ${response.status}`)
            }

            const data = await response.json()
            const results: SearchResult[] = []

            // Abstract (main answer)
            if (data.Abstract && data.AbstractURL) {
                results.push({
                    title: data.Heading || 'DuckDuckGo Answer',
                    url: data.AbstractURL,
                    snippet: data.Abstract,
                    source: 'duckduckgo'
                })
            }

            // Related topics
            if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
                for (const topic of data.RelatedTopics) {
                    if (results.length >= maxResults) break

                    if (topic.Text && topic.FirstURL) {
                        results.push({
                            title: topic.Text.split(' - ')[0] || 'Related',
                            url: topic.FirstURL,
                            snippet: topic.Text,
                            source: 'duckduckgo'
                        })
                    }

                    // Handle nested topics
                    if (topic.Topics && Array.isArray(topic.Topics)) {
                        for (const subTopic of topic.Topics) {
                            if (results.length >= maxResults) break
                            if (subTopic.Text && subTopic.FirstURL) {
                                results.push({
                                    title: subTopic.Text.split(' - ')[0] || 'Related',
                                    url: subTopic.FirstURL,
                                    snippet: subTopic.Text,
                                    source: 'duckduckgo'
                                })
                            }
                        }
                    }
                }
            }

            // Results (less common in Instant Answer API)
            if (data.Results && Array.isArray(data.Results)) {
                for (const result of data.Results) {
                    if (results.length >= maxResults) break
                    if (result.Text && result.FirstURL) {
                        results.push({
                            title: result.Text.split(' - ')[0] || 'Result',
                            url: result.FirstURL,
                            snippet: result.Text,
                            source: 'duckduckgo'
                        })
                    }
                }
            }

            return results.slice(0, maxResults)
        } catch (error) {
            console.error('[DuckDuckGo] Search failed:', error)
            // Return empty rather than throwing - this is a fallback
            return []
        }
    }
}

export const duckduckgoProvider = new DuckDuckGoProvider()
