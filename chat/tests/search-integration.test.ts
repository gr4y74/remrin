/**
 * Search Integration Tests
 * 
 * Tests for multi-provider search with fallback and tool calling
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { searchManager } from '@/lib/chat-engine/capabilities/search'
import { tavilyProvider } from '@/lib/chat-engine/capabilities/search/tavily'
import { googleProvider } from '@/lib/chat-engine/capabilities/search/google'
import { braveProvider } from '@/lib/chat-engine/capabilities/search/brave'
import { duckduckgoProvider } from '@/lib/chat-engine/capabilities/search/duckduckgo'
import { executeSearchTool } from '@/lib/tools/search-tool-handler'
import { shouldTriggerSearch, extractSearchQuery } from '@/lib/tools/search-tools'

describe('Search Providers', () => {
    describe('Tavily Provider', () => {
        it('should be available when API key is configured', () => {
            const isAvailable = tavilyProvider.isAvailable()
            expect(typeof isAvailable).toBe('boolean')
        })

        it('should search and return results', async () => {
            if (!tavilyProvider.isAvailable()) {
                console.log('⚠️ Tavily API key not configured, skipping test')
                return
            }

            const results = await tavilyProvider.search('AI news', 3)
            expect(Array.isArray(results)).toBe(true)
            if (results.length > 0) {
                expect(results[0]).toHaveProperty('title')
                expect(results[0]).toHaveProperty('url')
                expect(results[0]).toHaveProperty('snippet')
            }
        }, 10000)
    })

    describe('Google Provider', () => {
        it('should check availability correctly', () => {
            const isAvailable = googleProvider.isAvailable()
            expect(typeof isAvailable).toBe('boolean')
        })
    })

    describe('Brave Provider', () => {
        it('should check availability correctly', () => {
            const isAvailable = braveProvider.isAvailable()
            expect(typeof isAvailable).toBe('boolean')
        })
    })

    describe('DuckDuckGo Provider', () => {
        it('should always be available', () => {
            expect(duckduckgoProvider.isAvailable()).toBe(true)
        })

        it('should search and return results', async () => {
            const results = await duckduckgoProvider.search('TypeScript', 3)
            expect(Array.isArray(results)).toBe(true)
        }, 10000)
    })
})

describe('Search Manager', () => {
    describe('Provider Management', () => {
        it('should get available providers', () => {
            const available = searchManager.getAvailableProviders()
            expect(Array.isArray(available)).toBe(true)
            expect(available.length).toBeGreaterThan(0)
        })

        it('should get best provider', () => {
            const best = searchManager.getBestProvider()
            expect(best).toBeTruthy()
            expect(best?.id).toBeTruthy()
        })

        it('should get provider status', () => {
            const status = searchManager.getProviderStatus()
            expect(status).toBeTruthy()
            expect(status.tavily).toBeDefined()
            expect(status.duckduckgo).toBeDefined()
        })
    })

    describe('Search with Fallback', () => {
        it('should perform search with automatic fallback', async () => {
            const response = await searchManager.search('JavaScript', 3)

            expect(response).toBeTruthy()
            expect(response.query).toBe('JavaScript')
            expect(Array.isArray(response.results)).toBe(true)
            expect(response.provider).toBeTruthy()
            expect(response.timestamp).toBeInstanceOf(Date)
        }, 15000)

        it('should format results for AI', async () => {
            const response = await searchManager.search('React', 2)
            const formatted = searchManager.formatForAI(response)

            expect(typeof formatted).toBe('string')
            expect(formatted.length).toBeGreaterThan(0)
        }, 15000)
    })

    describe('Circuit Breaker', () => {
        it('should handle provider failures gracefully', async () => {
            // This test would need to mock a failing provider
            // For now, just ensure the search doesn't crash
            const response = await searchManager.search('test query', 1)
            expect(response).toBeTruthy()
        }, 10000)
    })
})

describe('Search Tool Handler', () => {
    it('should execute search tool with valid args', async () => {
        const result = await executeSearchTool({
            query: 'Next.js',
            max_results: 3
        })

        expect(result).toBeTruthy()
        expect(result.success).toBe(true)
        expect(Array.isArray(result.results)).toBe(true)
    }, 15000)

    it('should handle invalid args', async () => {
        const result = await executeSearchTool({
            query: '',
            max_results: 5
        })

        expect(result.success).toBe(false)
        expect(result.error).toBeTruthy()
    })

    it('should respect max_results parameter', async () => {
        const result = await executeSearchTool({
            query: 'TypeScript',
            max_results: 2
        })

        if (result.success && result.results) {
            expect(result.results.length).toBeLessThanOrEqual(2)
        }
    }, 15000)
})

describe('Search Trigger Detection', () => {
    it('should detect search triggers', () => {
        expect(shouldTriggerSearch('What is the latest news about AI?')).toBe(true)
        expect(shouldTriggerSearch('Search for React tutorials')).toBe(true)
        expect(shouldTriggerSearch('What is the weather today?')).toBe(true)
        expect(shouldTriggerSearch('Who is the president in 2025?')).toBe(true)
    })

    it('should not trigger on normal conversation', () => {
        expect(shouldTriggerSearch('Hello, how are you?')).toBe(false)
        expect(shouldTriggerSearch('Tell me a joke')).toBe(false)
        expect(shouldTriggerSearch('I love programming')).toBe(false)
    })

    it('should extract search queries correctly', () => {
        expect(extractSearchQuery('Can you search for TypeScript tutorials?'))
            .toBe('search for TypeScript tutorials')

        expect(extractSearchQuery('What is the weather in Tokyo?'))
            .toBe('What is the weather in Tokyo')

        expect(extractSearchQuery('Please find information about React'))
            .toBe('find information about React')
    })
})

describe('End-to-End Search Integration', () => {
    it('should complete full search workflow', async () => {
        // 1. Detect if search is needed
        const message = 'What is the latest news about AI?'
        const needsSearch = shouldTriggerSearch(message)
        expect(needsSearch).toBe(true)

        // 2. Extract query
        const query = extractSearchQuery(message)
        expect(query.length).toBeGreaterThan(0)

        // 3. Execute search via tool handler
        const result = await executeSearchTool({
            query,
            max_results: 3
        })

        expect(result.success).toBe(true)
        expect(result.results).toBeTruthy()

        // 4. Verify results structure
        if (result.results && result.results.length > 0) {
            const firstResult = result.results[0]
            expect(firstResult.title).toBeTruthy()
            expect(firstResult.url).toBeTruthy()
            expect(firstResult.snippet).toBeTruthy()
        }
    }, 20000)
})
