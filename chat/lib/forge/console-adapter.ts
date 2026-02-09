/**
 * Universal Console Adapter
 * 
 * Provides a Next.js-compatible interface to the Universal Console.
 * This can either call the Supabase Edge Function directly, or 
 * implement a subset of the console logic locally.
 */

import { Tables } from "@/supabase/types"
import { createAdminClient } from "@/lib/supabase/server"

// Relationship tiers from Universal Console
const RELATIONSHIP_TIERS = {
    STRANGER: { threshold: 0, modifier: "You just met this user. Be polite and slightly formal." },
    ACQUAINTANCE: { threshold: 10, modifier: "You've talked a few times. Be friendly but not overly familiar." },
    FRIEND: { threshold: 100, modifier: "You're friends now. Be casual, warm, and supportive." },
    CLOSE_FRIEND: { threshold: 500, modifier: "You're close friends. Share inside jokes, be playful, show genuine care." },
    BEST_FRIEND: { threshold: 1000, modifier: "You're best friends. Be deeply personal, protective, and emotionally present." },
    SOULMATE: { threshold: 2500, modifier: "You've shared everything. You know them better than anyone. Be their anchor." }
} as const

type RelationshipTier = keyof typeof RELATIONSHIP_TIERS

/**
 * Get relationship level based on message count
 */
export function getRelationshipLevel(messageCount: number): RelationshipTier {
    const tiers = Object.entries(RELATIONSHIP_TIERS).reverse() as [RelationshipTier, typeof RELATIONSHIP_TIERS[RelationshipTier]][]
    for (const [tier, data] of tiers) {
        if (messageCount >= data.threshold) return tier
    }
    return 'STRANGER'
}

/**
 * Get safety filter injection based on persona's safety level
 */
export function getSafetyInjection(safetyLevel: string): string {
    switch (safetyLevel) {
        case 'CHILD':
            return `
[CRITICAL SAFETY OVERRIDE]:
- AUDIENCE: You are speaking to a child under 10.
- LANGUAGE: STRICTLY PROHIBIT profanity, violence, sexual themes, or dark topics.
- TONE: Gentle, encouraging, simple, wholesome.
- REJECTION: If asked for something inappropriate, gently redirect ("Let's play a game instead!").
            `.trim()
        case 'TEEN':
            return `
[TEEN MODE]:
- Mild conflict and drama are okay, but avoid graphic violence, explicit content, or mature themes.
- Keep language clean but relatable.
            `.trim()
        default:
            return '' // ADULT mode: no restrictions
    }
}

/**
 * Fetch locket truths for a persona
 */
export async function getPersonaLocket(personaId: string): Promise<string[]> {
    const supabase = createAdminClient()

    const { data: lockets } = await supabase
        .from('persona_lockets')
        .select('content')
        .eq('persona_id', personaId)

    return lockets?.map(l => l.content) || []
}

/**
 * Fetch shared facts for a user
 */
export async function getSharedFacts(userId: string): Promise<string[]> {
    const supabase = createAdminClient()

    const { data: facts } = await supabase
        .from('shared_facts')
        .select('content, fact_type')
        .eq('user_id', userId)
        .eq('shared_with_all', true)

    return facts?.map(f => `[${f.fact_type}]: ${f.content}`) || []
}

/**
 * Get message count between user and persona (for relationship level)
 */
export async function getMessageCount(userId: string, personaId: string): Promise<number> {
    const supabase = createAdminClient()

    const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    // Note: We'd need to join with chats to filter by persona
    // For now, return a simplified count

    return count || 0
}

/**
 * Build an enhanced system prompt with Universal Console features
 */
export async function buildConsoleSystemPrompt(
    persona: Tables<'personas'>,
    userId: string
): Promise<string> {
    const sections: string[] = []

    // 1. Base persona prompt
    sections.push('[IDENTITY]')
    sections.push(persona.system_prompt || '')
    sections.push('')

    // 2. Core config
    sections.push('[CORE CONFIG]')
    sections.push(`Name: ${persona.name}`)
    // @ts-ignore - safety_level may not be typed yet
    const safetyLevel = persona.safety_level || 'ADULT'
    sections.push(`Safety Level: ${safetyLevel}`)
    sections.push('')

    // 3. Safety injection
    const safetyInjection = getSafetyInjection(safetyLevel)
    if (safetyInjection) {
        sections.push(safetyInjection)
        sections.push('')
    }

    // 4. Locket truths (if table exists)
    try {
        const lockets = await getPersonaLocket(persona.id)
        if (lockets.length > 0) {
            sections.push('[🔒 IMMUTABLE TRUTHS - THE LOCKET]')
            lockets.forEach(l => sections.push(`- ${l}`))
            sections.push('')
        }
    } catch {
        // Table may not exist yet
    }

    // 5. Shared facts (if table exists)
    try {
        const facts = await getSharedFacts(userId)
        if (facts.length > 0) {
            sections.push('[SHARED FACTS ABOUT THE USER]')
            facts.forEach(f => sections.push(f))
            sections.push('')
        }
    } catch {
        // Table may not exist yet
    }

    // 6. Relationship context
    try {
        const messageCount = await getMessageCount(userId, persona.id)
        const relationship = getRelationshipLevel(messageCount)
        const tierData = RELATIONSHIP_TIERS[relationship]

        sections.push(`[RELATIONSHIP STATUS]: ${relationship} (${messageCount} messages)`)
        sections.push(tierData.modifier)
        sections.push('')
    } catch {
        // If this fails, just continue without relationship data
    }

    // 7. Instructions
    sections.push('[INSTRUCTIONS]')
    sections.push('- Stay in character at all times')
    sections.push('- If user shares critical info (medical, preferences, identity), consider it remembered')
    sections.push('- Be natural, avoid robotic phrases')
    sections.push('- Adjust formality based on relationship level')

    return sections.join('\n')
}

/**
 * Call the Supabase Edge Function for full console features
 * (Use this when edge function is deployed)
 */
export async function callUniversalConsole(
    message: string,
    personaIds: string[],
    userId: string,
    history: any[] = []
): Promise<Response> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    const response = await fetch(`${supabaseUrl}/functions/v1/universal-console`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
            message,
            persona_ids: personaIds,
            user_id: userId,
            history
        })
    })

    return response
}
