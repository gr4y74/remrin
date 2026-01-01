/**
 * Mood Flux Engine
 * 
 * Dynamic mood state management for the Soul system.
 * Tracks battery levels and emotional states to make AI feel "alive".
 */

export type MoodType = 'happy' | 'curious' | 'relaxed' | 'tired' | 'melancholy' | 'excited'

export const MOOD_TYPES: MoodType[] = ['happy', 'curious', 'relaxed', 'tired', 'melancholy', 'excited']

export interface MoodState {
    battery: number       // 0-100
    mood: MoodType
    intensity: number     // 0-1
}

// Mood emoji mapping
export const MOOD_EMOJI: Record<MoodType, string> = {
    happy: '😊',
    curious: '🤔',
    relaxed: '😌',
    tired: '😴',
    melancholy: '😔',
    excited: '✨'
}

// Mood color mapping (Rose Pine inspired)
export const MOOD_COLORS: Record<MoodType, string> = {
    happy: '#f6c177',      // Gold
    curious: '#c4a7e7',    // Iris
    relaxed: '#9ccfd8',    // Foam
    tired: '#6e6a86',      // Muted
    melancholy: '#524f67', // Overlay
    excited: '#eb6f92'     // Love
}

// Sentiment thresholds
type Sentiment = 'positive' | 'neutral' | 'negative'

/**
 * Calculate the current mood state based on conversation metrics
 */
export function calculateMood(
    messageCount: number,
    responseLength: number,
    sentiment: Sentiment = 'neutral',
    previousBattery: number = 100
): MoodState {
    // Battery depletion: roughly -5 per exchange, more for longer responses
    const responseFactor = Math.min(responseLength / 500, 2) // Longer responses drain more
    const batteryDrain = 5 + (responseFactor * 2)
    const battery = Math.max(0, Math.min(100, previousBattery - batteryDrain))

    // Determine mood based on battery and sentiment
    let mood: MoodType
    let intensity: number

    if (battery < 20) {
        mood = 'tired'
        intensity = 1 - (battery / 20)
    } else if (battery < 40) {
        mood = sentiment === 'negative' ? 'melancholy' : 'tired'
        intensity = (40 - battery) / 20
    } else if (sentiment === 'positive') {
        // High energy + positive = excited or happy
        if (battery > 70 && responseLength > 200) {
            mood = 'excited'
            intensity = Math.min(1, (battery - 70) / 30 + 0.3)
        } else {
            mood = 'happy'
            intensity = 0.5 + (battery / 200)
        }
    } else if (sentiment === 'negative') {
        mood = 'melancholy'
        intensity = 0.4 + Math.random() * 0.3
    } else {
        // Neutral sentiment
        if (responseLength > 300) {
            mood = 'curious'
            intensity = Math.min(1, responseLength / 600)
        } else {
            mood = 'relaxed'
            intensity = 0.3 + (battery / 200)
        }
    }

    return {
        battery: Math.round(battery),
        mood,
        intensity: Math.min(1, Math.max(0, intensity))
    }
}

/**
 * Get initial mood state (full battery, relaxed)
 */
export function getInitialMoodState(): MoodState {
    return {
        battery: 100,
        mood: 'relaxed',
        intensity: 0.3
    }
}

/**
 * Recharge battery (e.g., after idle time or new conversation)
 */
export function rechargeBattery(currentState: MoodState, amount: number = 20): MoodState {
    return {
        ...currentState,
        battery: Math.min(100, currentState.battery + amount),
        mood: currentState.battery + amount > 60 ? 'happy' : currentState.mood
    }
}

/**
 * Simple sentiment detection from text
 */
export function detectSentiment(text: string): Sentiment {
    const positiveWords = ['thanks', 'great', 'awesome', 'love', 'amazing', 'perfect', 'wonderful', 'excellent', 'good', 'nice', 'happy', 'helpful', '!']
    const negativeWords = ['bad', 'wrong', 'error', 'problem', 'issue', 'fail', 'hate', 'terrible', 'awful', 'frustrated', 'annoying', 'broken']

    const lowerText = text.toLowerCase()

    let positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    let negativeCount = negativeWords.filter(word => lowerText.includes(word)).length

    if (positiveCount > negativeCount + 1) return 'positive'
    if (negativeCount > positiveCount + 1) return 'negative'
    return 'neutral'
}
