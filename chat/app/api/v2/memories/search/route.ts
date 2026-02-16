import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { handleApiError } from '@/lib/errors'
import { generateEmbedding } from '@/lib/chat-engine/embeddings'

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

        // 1. Semantic Search (Deep RAG)
        let memories: any[] = []
        let usedSemantic = false

        try {
            console.log(`[Memory Search] Generating embedding for: "${query}"`)
            const embedding = await generateEmbedding(query)

            if (embedding) {
                console.log(`[Memory Search] Semantic search triggered for user: ${user.id}`)
                const { data: matchedMemories, error: matchError } = await supabase.rpc('match_memories_v2', {
                    query_embedding: embedding,
                    match_threshold: 0.35,
                    match_count: limit,
                    filter_persona: personaId,
                    filter_user: user.id
                })

                if (!matchError && matchedMemories && matchedMemories.length > 0) {
                    memories = matchedMemories
                    usedSemantic = true
                    console.log(`[Memory Search] Semantic search found ${memories.length} results`)
                } else if (matchError) {
                    console.error('[Memory Search] match_memories_v2 error:', matchError.message)
                }
            }
        } catch (e) {
            console.error('[Memory Search] Semantic search failed:', e)
        }

        // 2. Keyword Search (Fallback / Complement)
        const keywords = query.split(/\s+/).filter((k: string) => k.length > 2)

        if (!usedSemantic || memories.length < (limit / 2)) {
            console.log(`[Memory Search] Running keyword fallback search...`)

            let memoryQuery = supabase
                .from('memories')
                .select('*')
                .eq('user_id', user.id)
                .order('importance', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(limit)

            if (personaId) {
                memoryQuery = memoryQuery.eq('persona_id', personaId)
            }

            if (keywords.length > 0) {
                const filters = keywords.map((k: string) => `content.ilike.%${k}%`).join(',')
                memoryQuery = memoryQuery.or(filters)
            } else {
                memoryQuery = memoryQuery.ilike('content', `%${query}%`)
            }

            // Exclude already found semantic results if any
            if (memories.length > 0) {
                const existingIds = memories.map(m => m.id)
                memoryQuery = memoryQuery.not('id', 'in', `(${existingIds.join(',')})`)
            }

            const { data: keywordMemories, error: kwError } = await memoryQuery
            if (!kwError && keywordMemories) {
                memories = [...memories, ...keywordMemories].slice(0, limit)
                console.log(`[Memory Search] Combined search total: ${memories.length} results`)
            }
        }

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
                locketResults = lockets.map((l: any) => ({
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
