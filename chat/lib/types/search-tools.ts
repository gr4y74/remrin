/**
 * Search Tool Types
 * 
 * Shared types for search tool interactions
 */

export interface SearchToolArgs {
    query: string
    max_results?: number
    maxResults?: number
}

export interface SearchToolResult {
    success: boolean
    results?: Array<{
        title: string
        url: string
        snippet: string
    }>
    provider?: string
    error?: string
}
