/**
 * Search Middleware
 * 
 * Augments chat messages with web search results when appropriate.
 * Detects search-worthy queries and injects search context into the conversation.
 */

import { Tables } from "@/supabase/types"
import { ChatMessage } from "@/types"
import {
    searchWeb,
    formatSearchContext,
    shouldTriggerSearch,
    extractSearchQuery,
    SearchOptions
} from "./tavily-search"

export interface SearchMiddlewareOptions {
    enabled: boolean
    mode: 'always' | 'smart' | 'never'
    searchDepth?: 'basic' | 'advanced'
    maxResults?: number
}

const DEFAULT_MIDDLEWARE_OPTIONS: SearchMiddlewareOptions = {
    enabled: true,
    mode: 'smart',
    searchDepth: 'basic',
    maxResults: 5
}

/**
 * Augment messages with web search context if appropriate
 * This injects search results into the system message
 */
export async function augmentWithSearch(
    messages: Array<{ role: string; content: string }>,
    persona: Tables<"personas"> | null,
    options: Partial<SearchMiddlewareOptions> = {}
): Promise<Array<{ role: string; content: string }>> {
    const mergedOptions = { ...DEFAULT_MIDDLEWARE_OPTIONS, ...options }

    // Check if search is disabled
    if (!mergedOptions.enabled || mergedOptions.mode === 'never') {
        return messages
    }

    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) {
        return messages
    }

    const userContent = lastUserMessage.content

    // Check if we should trigger a search
    if (mergedOptions.mode === 'smart' && !shouldTriggerSearch(userContent)) {
        return messages
    }

    // Extract search query and perform search
    const query = extractSearchQuery(userContent)
    console.log(`🔍 [Search] Querying: "${query}"`)

    const searchResults = await searchWeb(query, {
        searchDepth: mergedOptions.searchDepth,
        maxResults: mergedOptions.maxResults
    })

    // If no results, return original messages
    if (searchResults.results.length === 0) {
        console.log('[Search] No results found')
        return messages
    }

    console.log(`[Search] Found ${searchResults.results.length} results`)

    // Format search results as context
    const searchContext = formatSearchContext(searchResults)

    // Find and augment the system message
    const augmentedMessages = messages.map((msg, index) => {
        if (index === 0 && msg.role === 'system') {
            return {
                ...msg,
                content: `${msg.content}\n\n${searchContext}`
            }
        }
        return msg
    })

    // If there's no system message, prepend one with search context
    if (augmentedMessages.length === 0 || augmentedMessages[0].role !== 'system') {
        augmentedMessages.unshift({
            role: 'system',
            content: `You have access to the following real-time search results. Use them to provide accurate, up-to-date information:\n\n${searchContext}`
        })
    }

    return augmentedMessages
}

/**
 * Create search-aware system prompt modifier for a persona
 */
export function createSearchAwarePrompt(
    basePrompt: string,
    webSearchEnabled: boolean
): string {
    if (!webSearchEnabled) {
        return basePrompt
    }

    const searchInstructions = `

[WEB SEARCH CAPABILITY]
You have access to real-time internet search results. When search results are provided:
1. Use the information to provide accurate, current answers
2. Cite sources using [1], [2], etc. referring to the numbered sources
3. If search results contradict your training data, prefer the search results for current events
4. Be transparent about what information comes from search vs. your knowledge

`

    return basePrompt + searchInstructions
}

/**
 * Check if web search should be enabled for a chat session
 */
export async function shouldEnableSearch(
    userWebSearchEnabled: boolean,
    modelWebSearchEnabled: boolean,
    personaConfig?: Record<string, unknown>
): Promise<boolean> {
    // All three must agree: user preference, model capability, and persona config
    const personaSearchEnabled = personaConfig?.web_search_enabled !== false

    return userWebSearchEnabled && modelWebSearchEnabled && personaSearchEnabled
}
