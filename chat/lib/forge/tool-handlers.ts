/**
 * Soul Forge Tool Handlers
 *
 * Handles tool calls from The Mother of Souls during the Soul Forge ritual.
 * These handlers connect the AI's tool calls to actual API endpoints.
 */

import type {
    GenerateSoulPortraitParams,
    GenerateSoulPortraitResult,
    FinalizeSoulParams,
    FinalizeSoulResult,
    ShowSoulRevealParams,
    ShowSoulRevealResult
} from '@/lib/tools/soul-forge-tools'
import { UpdateLocketParams } from '@/lib/tools/locket-tools'
import { type SearchToolArgs, type SearchToolResult } from '@/lib/types/search-tools'

/**
 * Portrait generation state for UI tracking
 */
export interface PortraitGenerationState {
    isGenerating: boolean
    progress: number // 0-100
    imageUrl: string | null
    error: string | null
}

/**
 * Soul reveal data for UI rendering
 */
export interface SoulRevealData {
    name: string
    essence: string
    personality: string
    voiceDescription?: string
    imageUrl: string
    voiceId?: string | null
}

/**
 * Handle generate_soul_portrait tool call
 * Calls the /api/forge/generate-portrait endpoint
 */
export async function handleGeneratePortraitTool(
    params: GenerateSoulPortraitParams
): Promise<GenerateSoulPortraitResult> {
    try {
        const response = await fetch('/api/forge/generate-portrait', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appearance_description: params.appearance_description
            })
        })

        if (!response.ok) {
            const error = await response.json()
            return {
                image_url: '',
                success: false,
                error: error.message || 'Failed to generate portrait'
            }
        }

        const data = await response.json()
        return {
            image_url: data.image_url,
            success: true
        }
    } catch (error) {
        console.error('[Tool Handler] Portrait generation failed:', error)
        return {
            image_url: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Handle finalize_soul tool call
 * Calls the /api/forge/finalize-soul endpoint
 */
export async function handleFinalizeSoulTool(
    params: FinalizeSoulParams
): Promise<FinalizeSoulResult> {
    try {
        const response = await fetch('/api/forge/finalize-soul', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: params.name,
                essence: params.essence,
                personality: params.personality,
                voice_id: params.voice_id || null,
                image_url: params.image_url
            })
        })

        if (!response.ok) {
            const error = await response.json()
            return {
                persona_id: '',
                success: false,
                error: error.message || 'Failed to finalize soul'
            }
        }

        const data = await response.json()
        return {
            persona_id: data.persona_id,
            success: true
        }
    } catch (error) {
        console.error('[Tool Handler] Soul finalization failed:', error)
        return {
            persona_id: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

/**
 * Handle show_soul_reveal tool call
 * Returns the reveal data for UI injection
 */
export async function handleShowSoulRevealTool(
    params: ShowSoulRevealParams
): Promise<ShowSoulRevealResult & { revealData: SoulRevealData }> {
    const { persona_data } = params

    // Create reveal data for UI
    const revealData: SoulRevealData = {
        name: persona_data.name,
        essence: persona_data.essence,
        personality: persona_data.personality,
        voiceDescription: persona_data.voice_description,
        imageUrl: persona_data.image_url
    }

    return {
        displayed: true,
        success: true,
        revealData
    }
}

/**
 * Route a tool call to the appropriate handler
 */
export async function routeForgeToolCall(
    toolName: string,
    params: unknown,
    onPortraitStart?: () => void,
    onPortraitComplete?: (imageUrl: string) => void,
    onReveal?: (data: SoulRevealData) => void,
    personaId?: string
): Promise<{ success: boolean; result: unknown; error?: string }> {
    try {
        switch (toolName) {
            case 'web_search': {
                console.log('🔍 [Antigravity] Web Search Triggered via Tool Router')
                console.log('🔍 [Tool Router] Executing web search with params:', JSON.stringify(params))
                try {
                    const response = await fetch('/api/v2/search', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include', // Ensure cookies are sent
                        body: JSON.stringify(params)
                    })

                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}))
                        return {
                            success: false,
                            result: null,
                            error: error.error || 'Search failed'
                        }
                    }

                    const result = await response.json()
                    return { success: true, result }
                } catch (error) {
                    console.error('[Tool Router] Search failed:', error)
                    return {
                        success: false,
                        result: null,
                        error: error instanceof Error ? error.message : 'Search failed'
                    }
                }
            }

            case 'generate_soul_portrait': {
                // Notify UI that portrait generation is starting
                onPortraitStart?.()

                const result = await handleGeneratePortraitTool(
                    params as GenerateSoulPortraitParams
                )

                if (result.success && result.image_url) {
                    onPortraitComplete?.(result.image_url)
                }

                return { success: result.success, result, error: result.error }
            }

            case 'finalize_soul': {
                const result = await handleFinalizeSoulTool(
                    params as FinalizeSoulParams
                )
                return { success: result.success, result, error: result.error }
            }

            case 'show_soul_reveal': {
                const result = await handleShowSoulRevealTool(
                    params as ShowSoulRevealParams
                )

                if (result.success) {
                    onReveal?.(result.revealData)
                }

                return { success: result.success, result, error: result.error }
            }

            case 'update_locket': {
                console.log('🔒 [Tool Router] Updating Locket:', params)
                try {
                    const response = await fetch('/api/v2/locket', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ ...params as UpdateLocketParams, personaId })
                    })

                    if (!response.ok) throw new Error('Failed to update locket')

                    const result = await response.json()
                    return { success: true, result }
                } catch (e) {
                    return { success: false, result: null, error: 'Locket update failed' }
                }
            }

            case 'search_memories': {
                console.log('🧠 [Tool Router] Searching Memories:', params)
                try {
                    const response = await fetch('/api/v2/memories/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ ...params as any, personaId })
                    })

                    if (!response.ok) throw new Error('Failed to search memories')

                    const result = await response.json()
                    return { success: true, result }
                } catch (e) {
                    console.error('[Tool Router] Memory search failed:', e)
                    return { success: false, result: null, error: 'Memory search failed' }
                }
            }

            default:
                return {
                    success: false,
                    result: null,
                    error: `Unknown tool: ${toolName}`
                }
        }
    } catch (error) {
        console.error('[Route Tool Call] Error:', error)
        return {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}
