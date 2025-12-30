/**
 * Tavily Web Search Integration
 * 
 * Provides real-time internet search capabilities for all LLMs.
 * Tavily is optimized for RAG and AI applications.
 */

export interface SearchResult {
    title: string
    url: string
    content: string
    score: number
    publishedDate?: string
}

export interface TavilySearchResponse {
    query: string
    results: SearchResult[]
    answer?: string
    followUpQuestions?: string[]
}

// Search depth options
export type SearchDepth = 'basic' | 'advanced'

// Search options
export interface SearchOptions {
    searchDepth?: SearchDepth
    maxResults?: number
    includeAnswer?: boolean
    includeImages?: boolean
    includeDomains?: string[]
    excludeDomains?: string[]
}

const DEFAULT_OPTIONS: SearchOptions = {
    searchDepth: 'basic',
    maxResults: 5,
    includeAnswer: true,
    includeImages: false
}

/**
 * Search the web using Tavily API
 */
export async function searchWeb(
    query: string,
    options: SearchOptions = {}
): Promise<TavilySearchResponse> {
    const apiKey = process.env.TAVILY_API_KEY

    if (!apiKey) {
        console.warn('[Tavily] No API key configured, skipping search')
        return { query, results: [] }
    }

    const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: mergedOptions.searchDepth,
                max_results: mergedOptions.maxResults,
                include_answer: mergedOptions.includeAnswer,
                include_images: mergedOptions.includeImages,
                include_domains: mergedOptions.includeDomains,
                exclude_domains: mergedOptions.excludeDomains
            })
        })

        if (!response.ok) {
            console.error('[Tavily] Search failed:', response.status, await response.text())
            return { query, results: [] }
        }

        const data = await response.json()

        return {
            query: data.query || query,
            results: (data.results || []).map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.content,
                score: r.score || 0,
                publishedDate: r.published_date
            })),
            answer: data.answer,
            followUpQuestions: data.follow_up_questions
        }
    } catch (error) {
        console.error('[Tavily] Search error:', error)
        return { query, results: [] }
    }
}

/**
 * Format search results as context for system prompt injection
 */
export function formatSearchContext(response: TavilySearchResponse): string {
    if (!response.results || response.results.length === 0) {
        return ''
    }

    const lines: string[] = [
        '📡 [LIVE INTERNET SEARCH RESULTS]',
        `Query: "${response.query}"`,
        ''
    ]

    // Add the AI-generated answer if available
    if (response.answer) {
        lines.push('🎯 Summary:', response.answer, '')
    }

    // Add individual result citations
    lines.push('📚 Sources:')
    response.results.forEach((result, index) => {
        lines.push(`[${index + 1}] ${result.title}`)
        lines.push(`    ${result.url}`)
        if (result.content) {
            // Truncate long content
            const truncatedContent = result.content.length > 300
                ? result.content.substring(0, 300) + '...'
                : result.content
            lines.push(`    ${truncatedContent}`)
        }
        lines.push('')
    })

    lines.push('[END OF SEARCH RESULTS]')
    lines.push('')

    return lines.join('\n')
}

/**
 * Detect if a message likely needs web search
 * Uses keyword detection for common search triggers
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
        /\b(2024|2025|this year|last year)\b/i
    ]

    return searchTriggers.some(trigger => trigger.test(message))
}

/**
 * Extract search query from user message
 * Cleans up the message to form a better search query
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
