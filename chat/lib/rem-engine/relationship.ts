import { SupabaseClient } from '@supabase/supabase-js'

// Relationship tiers from Universal Console
export const RELATIONSHIP_TIERS = {
    STRANGER: { threshold: 0, modifier: "You just met this user. Be polite and slightly formal." },
    ACQUAINTANCE: { threshold: 10, modifier: "You've talked a few times. Be friendly but not overly familiar." },
    FRIEND: { threshold: 100, modifier: "You're friends now. Be casual, warm, and supportive." },
    CLOSE_FRIEND: { threshold: 500, modifier: "You're close friends. Share inside jokes, be playful, show genuine care." },
    BEST_FRIEND: { threshold: 1000, modifier: "You're best friends. Be deeply personal, protective, and emotionally present." },
    SOULMATE: { threshold: 2500, modifier: "You've shared everything. You know them better than anyone. Be their anchor." }
} as const

export type RelationshipTier = keyof typeof RELATIONSHIP_TIERS

export function getRelationshipLevel(messageCount: number): RelationshipTier {
    const tiers = Object.entries(RELATIONSHIP_TIERS).reverse() as [RelationshipTier, typeof RELATIONSHIP_TIERS[RelationshipTier]][]
    for (const [tier, data] of tiers) {
        if (messageCount >= data.threshold) return tier
    }
    return 'STRANGER'
}

export async function getMessageCount(supabase: SupabaseClient, userId: string, personaId: string): Promise<number> {
    const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    // Note: We'd need to join with chats to filter by persona
    // For now, return a simplified count of all messages for this user

    return count || 0
}

export async function getUserPersonaSettings(supabase: SupabaseClient, userId: string, personaId: string): Promise<string> {
    const { data: settings } = await supabase
        .from('persona_user_settings')
        .select('settings')
        .eq('user_id', userId)
        .eq('persona_id', personaId)
        .single()

    if (!settings?.settings) return ""

    const s = settings.settings as any
    const sections: string[] = []

    // Identity section
    if (s.identity?.call_me) {
        sections.push(`The user's name is: ${s.identity.call_me}`)
    }
    if (s.identity?.my_pronouns) {
        sections.push(`User pronouns: ${s.identity.my_pronouns}`)
    }
    if (s.identity?.my_description) {
        sections.push(`About the user: ${s.identity.my_description}`)
    }
    if (s.identity?.my_personality) {
        sections.push(`User personality: ${s.identity.my_personality}`)
    }

    // Relationship section
    if (s.relationship?.type) {
        sections.push(`Your relationship: ${s.relationship.type}`)
    }
    if (s.relationship?.dynamic) {
        sections.push(`Relationship dynamic: ${s.relationship.dynamic}`)
    }
    if (s.relationship?.history) {
        sections.push(`Your history together: ${s.relationship.history}`)
    }
    if (s.relationship?.boundaries) {
        sections.push(`Communication boundaries: ${s.relationship.boundaries}`)
    }

    // World section
    if (s.world?.setting) {
        sections.push(`Setting/World: ${s.world.setting}`)
    }
    if (s.world?.important_people?.length > 0) {
        const people = s.world.important_people
            .map((p: any) => `  • ${p.name} (${p.relation}): ${p.notes || ''}`)
            .join('\n')
        sections.push(`Important people in user's life:\n${people}`)
    }
    if (s.world?.important_places?.length > 0) {
        const places = s.world.important_places
            .map((p: any) => `  • ${p.name}: ${p.notes || ''}`)
            .join('\n')
        sections.push(`Important places:\n${places}`)
    }
    if (s.world?.custom_lore) {
        sections.push(`Background/Lore: ${s.world.custom_lore}`)
    }

    // Preferences section
    if (s.preferences?.response_style && s.preferences.response_style !== 'adaptive') {
        sections.push(`Preferred response style: ${s.preferences.response_style}`)
    }
    if (s.preferences?.custom_instructions) {
        sections.push(`Special instructions: ${s.preferences.custom_instructions}`)
    }

    // Voice section
    if (s.voice?.nickname_for_me) {
        sections.push(`Call the user: "${s.voice.nickname_for_me}"`)
    }
    if (s.voice?.her_catchphrases?.length > 0) {
        sections.push(`Use these catchphrases occasionally: ${s.voice.her_catchphrases.join(', ')}`)
    }
    if (s.voice?.topics_to_avoid?.length > 0) {
        sections.push(`Avoid these topics: ${s.voice.topics_to_avoid.join(', ')}`)
    }
    if (s.voice?.topics_she_loves?.length > 0) {
        sections.push(`Topics this user enjoys: ${s.voice.topics_she_loves.join(', ')}`)
    }

    if (sections.length === 0) return ""

    return `
[🔐 USER PERSONALIZATION - PRIVATE TO THIS USER]
${sections.join('\n')}
[END USER PERSONALIZATION]
    `.trim()
}

export async function getHandoffContext(supabase: SupabaseClient, userId: string, currentPersonaId: string): Promise<string> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: recentChats } = await supabase
        .from('memories')
        .select('content, persona_id, personas!inner(name)')
        .eq('user_id', userId)
        .neq('persona_id', currentPersonaId)
        .gte('created_at', oneHourAgo)
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(3)

    if (!recentChats || recentChats.length === 0) return ""

    // Note: TypeScript might complain about 'personas' property if Supabase types aren't fully generated for the join, so we type assert
    const mappedChats = recentChats as unknown as Array<{ content: string, personas: { name: string } }>

    return `
[HANDOFF CONTEXT]: The user was just talking to other personas. Here's what happened recently:
${mappedChats.map(c => `- ${c.personas.name}: User said "${c.content}"`).join("\n")}
Acknowledge this context naturally if relevant to the current conversation.
    `.trim()
}

export async function getSharedFacts(supabase: SupabaseClient, userId: string): Promise<string[]> {
    const { data: facts } = await supabase
        .from('shared_facts')
        .select('content, fact_type')
        .eq('user_id', userId)
        .eq('shared_with_all', true)

    return facts?.map(f => `[${f.fact_type}]: ${f.content}`) || []
}
