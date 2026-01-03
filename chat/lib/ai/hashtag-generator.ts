/**
 * AI-powered hashtag generation for personas
 * Uses OpenAI to analyze persona details and suggest relevant hashtags
 */

interface PersonaForTagging {
    name: string
    description: string
    system_prompt?: string
    category?: string
}

/**
 * Generate hashtag suggestions using AI
 * @param persona - Persona details to analyze
 * @returns Array of suggested hashtags (lowercase, without # symbol)
 */
export async function generateHashtags(persona: PersonaForTagging): Promise<string[]> {
    try {
        const response = await fetch('/api/ai/generate-hashtags', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: persona.name,
                description: persona.description,
                system_prompt: persona.system_prompt?.slice(0, 1000), // Limit to 1000 chars
                category: persona.category
            }),
        })

        if (!response.ok) {
            throw new Error(`Failed to generate hashtags: ${response.statusText}`)
        }

        const data = await response.json()
        return data.hashtags || []
    } catch (error) {
        console.error('Error generating hashtags:', error)
        return []
    }
}

/**
 * Validate a hashtag
 * @param tag - Hashtag to validate
 * @returns true if valid, false otherwise
 */
export function validateHashtag(tag: string): boolean {
    // Remove # if present
    const cleanTag = tag.replace(/^#/, '').toLowerCase().trim()

    // Must be 2-30 characters
    if (cleanTag.length < 2 || cleanTag.length > 30) return false

    // Only lowercase letters, numbers, and hyphens
    if (!/^[a-z0-9-]+$/.test(cleanTag)) return false

    // Cannot start or end with hyphen
    if (cleanTag.startsWith('-') || cleanTag.endsWith('-')) return false

    // Cannot have consecutive hyphens
    if (cleanTag.includes('--')) return false

    return true
}

/**
 * Clean and normalize a hashtag
 * @param tag - Hashtag to clean
 * @returns Cleaned hashtag (lowercase, without #)
 */
export function cleanHashtag(tag: string): string {
    return tag
        .replace(/^#/, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '')
}

/**
 * Get popular hashtags by category
 * @param category - Persona category
 * @returns Array of popular hashtags for that category
 */
export function getPopularHashtagsByCategory(category?: string): string[] {
    const categoryMap: Record<string, string[]> = {
        kids: ['kids', 'family-friendly', 'educational', 'fun', 'playful'],
        gaming: ['gaming', 'playful', 'competitive', 'fun', 'adventure'],
        education: ['educational', 'teacher', 'helper', 'knowledgeable', 'mentor'],
        productivity: ['productivity', 'helper', 'efficient', 'organized', 'assistant'],
        entertainment: ['entertainment', 'fun', 'creative', 'engaging', 'storytelling'],
        wellness: ['wellness', 'supportive', 'calm', 'mindful', 'therapeutic'],
        creative: ['creative', 'artistic', 'imaginative', 'inspiring', 'innovative'],
        religion: ['spiritual', 'wise', 'guidance', 'faith', 'philosophical'],
    }

    return categoryMap[category?.toLowerCase() || ''] || ['companion', 'friendly', 'helpful']
}
