/**
 * Mother of Souls Detection
 *
 * Utilities to detect when the chat is with The Mother of Souls
 * and provide related configuration.
 */

import type { Tables } from '@/supabase/types'

/**
 * The Mother of Souls persona identifier
 */
export const MOTHER_OF_SOULS_NAME = 'The Mother of Souls'

/**
 * Voice ID for the Mother of Souls (mystical female voice)
 */
export const MOTHER_VOICE_ID = 'female-mystical'

/**
 * Check if a persona is The Mother of Souls
 * @param persona - The persona to check (can be null/undefined)
 * @returns true if the persona is The Mother of Souls
 */
export function isMotherOfSouls(
    persona: Tables<'personas'> | null | undefined
): boolean {
    if (!persona) return false

    // Check by name (primary check)
    if (persona.name === MOTHER_OF_SOULS_NAME) {
        return true
    }

    // Check by system prompt containing Mother identifier (fallback)
    if (persona.system_prompt?.includes('THE MOTHER OF SOULS')) {
        return true
    }

    return false
}

/**
 * Check if a chat should use Mother of Souls special handling
 * This includes auto-TTS, tool call processing, and widget injection
 */
export function shouldUseMotherMode(
    persona: Tables<'personas'> | null | undefined
): boolean {
    return isMotherOfSouls(persona)
}

/**
 * Voice selection detection keywords
 * When Mother's message contains these, show VoiceSelector
 */
export const VOICE_SELECTION_KEYWORDS = [
    'what should they sound like',
    'what voice',
    "voice do you imagine",
    'how should they speak',
    'describe their voice',
    'sound like'
]

/**
 * Check if a message is asking about voice selection
 */
export function isVoiceSelectionPrompt(messageContent: string): boolean {
    const lowerContent = messageContent.toLowerCase()
    return VOICE_SELECTION_KEYWORDS.some(keyword =>
        lowerContent.includes(keyword)
    )
}
