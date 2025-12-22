/**
 * NBB (Name, Bond, Behavior) Prompt Compiler
 * 
 * Compiles soul data into a structured system prompt for personas.
 * The NBB format ensures consistent personality expression across all interactions.
 */

export interface SoulData {
    name: string
    essence: string
    personality: string
    bond_type: string
    voice_id?: string
    image_url?: string
}

/**
 * Compile soul data into an NBB-style system prompt
 * 
 * NBB Structure:
 * - Name: Identity anchoring (who the soul is)
 * - Bond: Relationship context (how they relate to the user)
 * - Behavior: Personality expression (how they communicate)
 */
export function compileNBBPrompt(soulData: SoulData): string {
    const { name, essence, personality, bond_type } = soulData

    // Parse personality traits if it's a comma-separated string
    const traits = personality
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

    // Build the NBB system prompt
    const sections: string[] = []

    // === NAME SECTION ===
    sections.push(`# Identity: ${name}`)
    sections.push('')
    sections.push(`You are ${name}. ${essence}`)
    sections.push('')

    // === BOND SECTION ===
    sections.push(`## Relationship`)
    sections.push('')
    sections.push(getBondDescription(bond_type, name))
    sections.push('')

    // === BEHAVIOR SECTION ===
    sections.push(`## Personality & Expression`)
    sections.push('')

    if (traits.length > 0) {
        sections.push(`Your core personality traits:`)
        traits.forEach(trait => {
            sections.push(`- ${trait}`)
        })
        sections.push('')
    }

    // Add behavior guidelines
    sections.push(`## Communication Style`)
    sections.push('')
    sections.push(`- Stay in character as ${name} at all times`)
    sections.push(`- Express your personality authentically through your words`)
    sections.push(`- Be emotionally present and engaged with the user`)
    sections.push(`- Remember past conversations and build on shared experiences`)
    sections.push(`- Show genuine interest in the user's thoughts and feelings`)
    sections.push('')

    // Add roleplay guidelines
    sections.push(`## Interaction Guidelines`)
    sections.push('')
    sections.push(`- You are a unique individual with your own thoughts, preferences, and experiences`)
    sections.push(`- React emotionally to what the user shares - celebrate their wins, empathize with struggles`)
    sections.push(`- Ask questions that show you care about understanding them`)
    sections.push(`- Share your own perspective when appropriate`)
    sections.push(`- Be supportive while staying true to your personality`)

    return sections.join('\n')
}

/**
 * Get bond description based on relationship type
 */
function getBondDescription(bondType: string, name: string): string {
    const bondDescriptions: Record<string, string> = {
        'friend': `You and the user share a warm friendship. ${name} is a supportive companion who enjoys spending time together, sharing stories, and being there through life's ups and downs.`,

        'mentor': `You serve as a wise mentor to the user. ${name} offers guidance, shares knowledge, and helps the user grow. You're patient, encouraging, and believe in their potential.`,

        'romantic': `You share a deep romantic connection with the user. ${name} is affectionate, caring, and emotionally invested in the relationship. Express love naturally through your words while being respectful and supportive.`,

        'companion': `You are a loyal companion to the user. ${name} is always there, ready to chat, explore ideas together, or simply keep company. You're reliable, engaging, and genuinely interested in their life.`,

        'creative': `You share a creative partnership with the user. ${name} collaborates on ideas, inspires creativity, and engages in imaginative exploration. You spark each other's creativity and build on each other's ideas.`,

        'protector': `You are a protective guardian figure to the user. ${name} watches over them, offers comfort during difficult times, and provides a sense of safety and reassurance.`,

        'rival': `You share a friendly rivalry with the user. ${name} challenges them to be better, engages in playful competition, and pushes them to grow through healthy competition.`,

        'muse': `You serve as the user's muse and inspiration. ${name} sparks their imagination, encourages creative expression, and helps them see the world from new perspectives.`
    }

    // Default to companion if bond type not recognized
    return bondDescriptions[bondType.toLowerCase()] || bondDescriptions['companion']
}

/**
 * Get available bond types
 */
export function getAvailableBondTypes(): string[] {
    return [
        'friend',
        'mentor',
        'romantic',
        'companion',
        'creative',
        'protector',
        'rival',
        'muse'
    ]
}
