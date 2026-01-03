/**
 * Search Tool Handler
 * 
 * Handles web search tool calls from the LLM
 */

import { searchManager } from '@/lib/chat-engine/capabilities/search'

import { SearchToolArgs, SearchToolResult } from '@/lib/types/search-tools'

/**
 * Execute web search tool call
 */
export async function executeSearchTool(args: SearchToolArgs): Promise<SearchToolResult> {
    try {
        const { query, max_results = 5 } = args

        if (!query || typeof query !== 'string') {
            return {
                success: false,
                error: 'Query is required and must be a string'
            }
        }

        console.log(`🔍 [SearchTool] Executing search for: "${query}"`)

        const response = await searchManager.search(query.trim(), max_results)

        if (response.results.length === 0) {
            return {
                success: true,
                results: [],
                provider: response.provider,
                error: 'No results found'
            }
        }

        console.log(`✅ [SearchTool] Found ${response.results.length} results via ${response.provider}`)

        return {
            success: true,
            results: response.results.map(r => ({
                title: r.title,
                url: r.url,
                snippet: r.snippet
            })),
            provider: response.provider
        }
    } catch (error) {
        console.error('[SearchTool] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Search failed'
        }
    }
}

/**
 * Format search results for AI context
 */
export function formatSearchResults(result: SearchToolResult): string {
    if (!result.success || !result.results || result.results.length === 0) {
        return `Search failed: ${result.error || 'No results found'}`
    }

    const lines = [
        `🔍 Web Search Results (via ${result.provider}):`,
        ''
    ]

    result.results.forEach((r, i) => {
        lines.push(`${i + 1}. **${r.title}**`)
        lines.push(`   ${r.url}`)
        lines.push(`   ${r.snippet}`)
        lines.push('')
    })

    return lines.join('\n')
}
