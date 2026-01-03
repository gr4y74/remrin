/**
 * Web Search Tools
 * 
 * Tool definitions for web search capability
 */

import { ToolDescriptor } from '@/lib/chat-engine/types'

export const SEARCH_TOOLS: ToolDescriptor[] = [
    {
        type: 'function',
        function: {
            name: 'web_search',
            description: 'Search the web for current information, news, facts, or any topic that requires up-to-date knowledge. Use this when the user asks about recent events, current prices, weather, news, or anything that requires real-time information.',
            parameters: {
                type: 'object',
                properties: {
                    query: {
                        type: 'string',
                        description: 'The search query to look up on the web. Be specific and concise.'
                    },
                    max_results: {
                        type: 'number',
                        description: 'Maximum number of search results to return (1-10). Default is 5.',
                        default: 5
                    }
                },
                required: ['query']
            }
        }
    }
]

/**
 * Detect if a message likely needs web search
 */
export function shouldTriggerSearch(message: string): boolean {
    const searchTriggers = [
        // Direct search requests
        /\b(search|google|look up|find|lookup)\b/i,
        // Current events
        /\b(latest|recent|current|today|yesterday|this week|this month|news)\b/i,
        // Factual queries
        /\b(what is|who is|when did|where is|how to|how do)\b/i,
        // Specific domains
        /\b(price of|weather in|stock|crypto|bitcoin|score|game)\b/i,
        // Temporal indicators
        /\b(2024|2025|2026|this year|last year)\b/i
    ]

    return searchTriggers.some(trigger => trigger.test(message))
}

/**
 * Extract search query from user message
 */
export function extractSearchQuery(message: string): string {
    // Remove common conversational prefixes
    let query = message
        .replace(/^(can you |could you |please |hey |hi |hello |)/i, '')
        .replace(/\?$/, '')
        .trim()

    // If the message is too long, try to extract the key question
    if (query.length > 200) {
        // Try to find a question within the message
        const questionMatch = query.match(/(?:what|who|when|where|why|how)[^.!?]*\?/i)
        if (questionMatch) {
            query = questionMatch[0]
        } else {
            // Just take the first sentence
            query = query.split(/[.!?]/)[0]
        }
    }

    return query
}
