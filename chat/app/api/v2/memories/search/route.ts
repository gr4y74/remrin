import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { handleApiError } from '@/lib/errors'

export const runtime = 'nodejs'

/**
 * API to search memories table for a specific user and persona
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { query, personaId, limit = 10, domain } = await request.json()

        if (!query) {
            return new Response('Query is required', { status: 400 })
        }

        // 1. Search memories table (past conversations)
        const keywords = query.split(/\s+/).filter((k: string) => k.length > 2)

        console.log(`[Memory Search] user_id: ${user.id}, personaId: ${personaId}, query: ${query}`);
        console.log(`[Memory Search] Keywords:`, keywords);

        let memoryQuery = supabase
            .from('memories')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (personaId) {
            memoryQuery = memoryQuery.eq('persona_id', personaId)
        }

        // If keywords exist, use them for more flexible matching
        if (keywords.length > 0) {
            const filters = keywords.map((k: string) => `content.ilike.%${k}%`).join(',')
            console.log(`[Memory Search] Using OR filters:`, filters);
            memoryQuery = memoryQuery.or(filters)
        } else {
            console.log(`[Memory Search] Using simple ilike: %${query}%`);
            memoryQuery = memoryQuery.ilike('content', `%${query}%`)
        }

        const { data: memories, error: memError } = await memoryQuery
        if (memError) throw memError

        console.log(`[Memory Search] Found ${memories?.length || 0} memories from table`);

        // 2. Search persona_lockets table (immutable truths)
        let locketResults: any[] = []
        if (personaId) {
            let locketQuery = supabase
                .from('persona_lockets')
                .select('*')
                .eq('persona_id', personaId)

            if (keywords.length > 0) {
                const lFilters = keywords.map((k: string) => `content.ilike.%${k}%`).join(',')
                locketQuery = locketQuery.or(lFilters)
            } else {
                locketQuery = locketQuery.ilike('content', `%${query}%`)
            }

            const { data: lockets, error: lockError } = await locketQuery
            if (!lockError && lockets) {
                locketResults = lockets.map(l => ({
                    ...l,
                    isLocket: true,
                    domain: 'locket'
                }))
            }
        }

        // Combine and return results
        const results = [
            ...locketResults,
            ...(memories || [])
        ]

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('[Memory Search API] Error:', error)
        return handleApiError(error)
    }
}
