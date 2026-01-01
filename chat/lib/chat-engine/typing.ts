/**
 * Typing Engine Logic
 * 
 * Handles timing and delays for the human-like typing effect.
 */

export interface TypingConfig {
    baseDelay: number;
    variance: number;
}

/**
 * Calculates the delay for the next chunk of text to be revealed.
 * 
 * @param contentType - 'prose' | 'code' | 'other'
 * @returns Delay in milliseconds
 */
export function getTypingDelay(contentType: 'prose' | 'code' | 'other' = 'prose'): number {
    let config: TypingConfig;

    switch (contentType) {
        case 'code':
            // Code blocks should feel almost instant but still have a slight "flow"
            config = { baseDelay: 3, variance: 2 };
            break;
        case 'prose':
        default:
            // Prose should feel like natural typing
            config = { baseDelay: 30, variance: 10 };
            break;
    }

    // Calculate delay with random variance
    const randomVariance = (Math.random() * 2 - 1) * config.variance;
    return Math.max(0, config.baseDelay + randomVariance);
}
