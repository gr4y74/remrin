/**
 * Search API Route
 * 
 * Provides web search capability through modular providers
 */

import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { searchManager } from '@/lib/chat-engine/capabilities/search'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        // Parse request
        const body = await request.json()
        const { query, maxResults: maxResultsCamel, max_results: maxResultsSnake } = body
        const maxResults = maxResultsCamel || maxResultsSnake || 5

        if (!query || typeof query !== 'string') {
            return new Response('Query is required', { status: 400 })
        }

        // Perform search
        const startTime = Date.now()
        const response = await searchManager.search(query.trim(), maxResults)
        const duration = Date.now() - startTime

        // Record statistics (non-blocking)
        try {
            const adminSupabase = createAdminClient()
            adminSupabase.from('search_stats').insert({
                provider_name: response.provider,
                query: query.trim(),
                success: response.results.length > 0,
                response_time_ms: duration,
                results_count: response.results.length,
                user_id: user.id
            }).then(({ error }) => {
                if (error) console.error('[Search API] Error recording stats:', error)
            })

            // Update provider health
            adminSupabase.from('search_provider_config')
                .select('success_count, total_response_time_ms, failure_count')
                .eq('provider_name', response.provider)
                .single()
                .then(({ data: current }) => {
                    if (current) {
                        adminSupabase.from('search_provider_config')
                            .update({
                                success_count: response.results.length > 0 ? current.success_count + 1 : current.success_count,
                                failure_count: response.results.length === 0 ? current.failure_count + 1 : current.failure_count,
                                total_response_time_ms: current.total_response_time_ms + duration,
                                last_success_at: response.results.length > 0 ? new Date().toISOString() : undefined,
                                last_failure_at: response.results.length === 0 ? new Date().toISOString() : undefined
                            })
                            .eq('provider_name', response.provider)
                            .then(({ error }) => {
                                if (error) console.error('[Search API] Error updating provider health:', error)
                            })
                    }
                })
        } catch (statsError) {
            console.error('[Search API] Stats recording failed:', statsError)
        }

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Search-Provider': response.provider
            }
        })

    } catch (error) {
        console.error('[Search API] Error:', error)
        return new Response(
            JSON.stringify({ error: 'Search failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}

/**
 * GET - Check search provider status
 */
export async function GET() {
    try {
        const status = searchManager.getProviderStatus()
        const available = searchManager.getAvailableProviders()

        return new Response(JSON.stringify({
            providers: status,
            availableCount: available.length,
            defaultProvider: available[0]?.id || null
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(
            JSON.stringify({ error: 'Failed to get status' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
