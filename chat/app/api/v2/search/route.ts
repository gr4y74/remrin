/**
 * Search API Route
 * 
 * Provides web search capability through modular providers
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
        const { query, maxResults = 5 } = body

        if (!query || typeof query !== 'string') {
            return new Response('Query is required', { status: 400 })
        }

        // Perform search
        const response = await searchManager.search(query.trim(), maxResults)

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
