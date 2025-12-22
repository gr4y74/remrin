/**
 * Prompt Builder for Soul Portrait Generation
 * 
 * Constructs optimized prompts for SDXL model to generate
 * high-quality fantasy character portraits.
 */

// Quality and style keywords for SDXL
const QUALITY_KEYWORDS = [
    "masterpiece",
    "best quality",
    "ultra detailed",
    "8k resolution",
    "highly detailed",
    "professional",
    "intricate details"
]

const STYLE_KEYWORDS = [
    "fantasy art",
    "digital painting",
    "character portrait",
    "dramatic lighting",
    "ethereal atmosphere",
    "cinematic"
]

// Default negative prompt to avoid common issues
const DEFAULT_NEGATIVE_PROMPT = [
    "low quality",
    "blurry",
    "watermark",
    "text",
    "deformed",
    "ugly",
    "disfigured",
    "bad anatomy",
    "bad proportions",
    "extra limbs",
    "duplicate",
    "mutation",
    "out of frame",
    "jpeg artifacts",
    "cropped"
].join(", ")

export interface PortraitPrompt {
    positive: string
    negative: string
}

/**
 * Build an optimized portrait prompt for SDXL
 * 
 * @param description - User's description of the character appearance
 * @param styleHints - Optional additional style modifiers
 * @returns PortraitPrompt with positive and negative prompts
 */
export function buildPortraitPrompt(
    description: string,
    styleHints?: string
): PortraitPrompt {
    // Sanitize and normalize the description
    const cleanDescription = description
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 500) // Limit length to prevent token overflow

    // Build base prompt components
    const promptParts: string[] = []

    // Add quality keywords
    promptParts.push(QUALITY_KEYWORDS.join(", "))

    // Add the user's description
    promptParts.push(cleanDescription)

    // Add style keywords
    promptParts.push(STYLE_KEYWORDS.join(", "))

    // Add custom style hints if provided
    if (styleHints && styleHints.trim()) {
        promptParts.push(styleHints.trim())
    }

    // Add portrait-specific framing
    promptParts.push("portrait composition, centered, facing viewer")

    return {
        positive: promptParts.join(", "),
        negative: DEFAULT_NEGATIVE_PROMPT
    }
}

/**
 * Build a prompt specifically for a soul/spirit companion portrait
 * Adds mystical and ethereal elements
 * 
 * @param description - Base character description
 * @param personality - Optional personality traits to reflect in appearance
 */
export function buildSoulPortraitPrompt(
    description: string,
    personality?: string
): PortraitPrompt {
    // Add soul-specific mystical elements
    const soulEnhancements = [
        "magical aura",
        "soft glowing light",
        "mystical presence",
        "otherworldly beauty"
    ]

    // Combine with personality-based visual hints
    let styleHints = soulEnhancements.join(", ")

    if (personality) {
        // Map personality traits to visual elements
        styleHints += `, expressive eyes reflecting ${personality.slice(0, 100)}`
    }

    return buildPortraitPrompt(description, styleHints)
}

/**
 * Get recommended SDXL parameters for portrait generation
 */
export function getPortraitGenerationParams() {
    return {
        width: 768,
        height: 1024, // Portrait aspect ratio
        num_inference_steps: 30,
        guidance_scale: 7.5,
        refine: "expert_ensemble_refiner",
        refine_steps: 10,
        scheduler: "KarrasDPM"
    }
}
