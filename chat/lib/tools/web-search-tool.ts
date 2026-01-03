/**
 * Web Search Tool
 * 
 * Tool definition for AI to trigger web searches
 */

import { ToolDescriptor } from '@/lib/chat-engine/types'

export const WEB_SEARCH_TOOL: ToolDescriptor = {
    type: 'function',
    function: {
        name: 'web_search',
        description: 'Search the web for current information, news, facts, or any real-time data. Use this when you need up-to-date information beyond your training data.',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query. Be specific and concise.'
                },
                maxResults: {
                    type: 'number',
                    description: 'Maximum number of results to return (1-10). Default is 5.',
                    default: 5
                }
            },
            required: ['query']
        }
    }
}

/**
 * Execute web search tool call
 */
export async function executeWebSearch(args: { query: string; maxResults?: number }): Promise<{
    success: boolean
    results?: any[]
    error?: string
}> {
    try {
        const response = await fetch('/api/v2/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: args.query,
                maxResults: args.maxResults || 5
            })
        })

        if (!response.ok) {
            throw new Error(`Search failed: ${response.statusText}`)
        }

        const data = await response.json()

        return {
            success: true,
            results: data.results,
        }
    } catch (error) {
        console.error('[WebSearchTool] Error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
