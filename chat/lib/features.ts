/**
 * Feature Flags Configuration
 * Centralized feature toggles for the Remrin chat application
 */

export const FEATURES = {
    /** Enable voice playback on AI messages */
    VOICE_ENABLED: true,

    /** Enable moments gallery feature */
    MOMENTS_ENABLED: true,

    /** Enable discovery/explore page */
    DISCOVERY_ENABLED: true,

    /** Enable follow button functionality */
    FOLLOW_ENABLED: true,

    /** Enable suggested replies */
    SUGGESTED_REPLIES_ENABLED: true,

    /** Enable typing indicator */
    TYPING_INDICATOR_ENABLED: true,
} as const

export type FeatureName = keyof typeof FEATURES

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
    return FEATURES[feature]
}
