/**
 * Auto-fetch relevant memories helper
 * 
 * Automatically searches memories based on user message keywords
 * and returns formatted memory context to inject into system prompt
 */

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface MemoryContext {
    memories: Array<{
        content: string
        created_at: string
        importance: number
    }>
    contextText: string
}

/**
 * Extract searchable keywords from user message
 */
function extractKeywords(message: string): string[] {
    // Remove common words, extract meaningful terms
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'tell', 'me', 'about', 'what', 'who', 'when', 'where', 'why', 'how'])

    const words = message.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ') // Keep alphanumeric and hyphens
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))

    return [...new Set(words)] // Remove duplicates
}

/**
 * Fetch relevant memories for a user message
 */
export async function fetchRelevantMemories(
    userId: string,
    personaId: string,
    userMessage: string,
    limit: number = 5
): Promise<MemoryContext> {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        // Extract keywords from user message
        const keywords = extractKeywords(userMessage)

        if (keywords.length === 0) {
            return { memories: [], contextText: '' }
        }

        console.log(`[Memory Auto-Fetch] Keywords from "${userMessage.substring(0, 50)}...":`, keywords)

        // Build query with OR filters for each keyword
        let query = supabase
            .from('memories')
            .select('content, created_at, importance, role')
            .eq('user_id', userId)
            .eq('persona_id', personaId)
            .order('importance', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(limit)

        // Add keyword filters
        if (keywords.length > 0) {
            const filters = keywords.map(k => `content.ilike.%${k}%`).join(',')
            query = query.or(filters)
        }

        const { data: memories, error } = await query

        if (error) {
            console.error('[Memory Auto-Fetch] Error:', error)
            return { memories: [], contextText: '' }
        }

        if (!memories || memories.length === 0) {
            console.log('[Memory Auto-Fetch] No memories found')
            return { memories: [], contextText: '' }
        }

        console.log(`[Memory Auto-Fetch] Found ${memories.length} relevant memories`)

        // Format memories as context
        const contextLines = [
            '[📚 RELEVANT PAST MEMORIES]',
            'The following are memories from your past conversations with this user:',
            ''
        ]

        memories.forEach((mem, idx) => {
            const date = new Date(mem.created_at).toLocaleDateString()
            const speaker = mem.role === 'user' ? 'User said' : 'You said'
            contextLines.push(`${idx + 1}. [${date}] ${speaker}: "${mem.content.substring(0, 150)}${mem.content.length > 150 ? '...' : ''}"`)
        })

        contextLines.push('')

        return {
            memories: memories.map(m => ({
                content: m.content,
                created_at: m.created_at,
                importance: m.importance || 5
            })),
            contextText: contextLines.join('\n')
        }

    } catch (error) {
        console.error('[Memory Auto-Fetch] Exception:', error)
        return { memories: [], contextText: '' }
    }
}
