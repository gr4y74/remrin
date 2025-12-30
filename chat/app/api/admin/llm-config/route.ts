/**
 * Admin LLM Configuration API
 * 
 * GET: Retrieve current LLM configuration
 * POST: Update active model configuration (admin only)
 * 
 * Note: Uses untyped Supabase client for llm_config table (new migration)
 */

import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { setDefaultModel } from "@/lib/models/model-config"

export const runtime = "edge"

// Simple admin auth check using environment variable
function isAdmin(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization')
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword) {
        console.warn('[Admin] No ADMIN_PASSWORD configured')
        return false
    }

    if (!authHeader) {
        return false
    }

    // Support both "Bearer token" and "Basic base64" formats
    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7) === adminPassword
    }

    if (authHeader.startsWith('Basic ')) {
        try {
            const decoded = Buffer.from(authHeader.slice(6), 'base64').toString()
            const [, password] = decoded.split(':')
            return password === adminPassword
        } catch {
            return false
        }
    }

    return false
}

/**
 * GET /api/admin/llm-config
 * 
 * Returns all LLM configurations
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: configs, error } = await supabase
            .from('llm_config')
            .select('*')
            .order('priority', { ascending: false })

        if (error) {
            console.error('[Admin LLM Config] Error fetching:', error)
            return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
        }

        // Get API key status for each provider
        const configsWithStatus = configs?.map(config => ({
            ...config,
            api_key_configured: !!process.env[getEnvKeyForProvider(config.provider)]
        })) || []

        return NextResponse.json({
            configs: configsWithStatus,
            current_default: configs?.find(c => c.is_default)?.model_id || null
        })
    } catch (error: any) {
        console.error('[Admin LLM Config] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

/**
 * POST /api/admin/llm-config
 * 
 * Update LLM configuration (admin only)
 * Body: { action: 'set_default' | 'toggle_enabled' | 'update_config', modelId: string, ... }
 */
export async function POST(request: NextRequest) {
    // Check admin authentication
    if (!isAdmin(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { action, modelId, enabled, webSearchEnabled, requiresPremium } = body

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        switch (action) {
            case 'set_default': {
                if (!modelId) {
                    return NextResponse.json({ error: 'modelId required' }, { status: 400 })
                }

                const success = await setDefaultModel(modelId)
                if (!success) {
                    return NextResponse.json({ error: 'Failed to set default model' }, { status: 500 })
                }

                console.log(`[Admin] Default model set to: ${modelId}`)
                return NextResponse.json({ success: true, message: `Default model set to ${modelId}` })
            }

            case 'toggle_enabled': {
                if (!modelId || typeof enabled !== 'boolean') {
                    return NextResponse.json({ error: 'modelId and enabled required' }, { status: 400 })
                }

                const { error } = await supabase
                    .from('llm_config')
                    .update({ is_enabled: enabled })
                    .eq('model_id', modelId)

                if (error) {
                    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
                }

                console.log(`[Admin] Model ${modelId} ${enabled ? 'enabled' : 'disabled'}`)
                return NextResponse.json({ success: true })
            }

            case 'toggle_search': {
                if (!modelId || typeof webSearchEnabled !== 'boolean') {
                    return NextResponse.json({ error: 'modelId and webSearchEnabled required' }, { status: 400 })
                }

                const { error } = await supabase
                    .from('llm_config')
                    .update({ web_search_enabled: webSearchEnabled })
                    .eq('model_id', modelId)

                if (error) {
                    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
                }

                return NextResponse.json({ success: true })
            }

            case 'toggle_premium': {
                if (!modelId || typeof requiresPremium !== 'boolean') {
                    return NextResponse.json({ error: 'modelId and requiresPremium required' }, { status: 400 })
                }

                const { error } = await supabase
                    .from('llm_config')
                    .update({ requires_premium: requiresPremium })
                    .eq('model_id', modelId)

                if (error) {
                    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
                }

                return NextResponse.json({ success: true })
            }

            case 'add_model': {
                const { provider, displayName, priority = 50 } = body
                if (!modelId || !provider || !displayName) {
                    return NextResponse.json({
                        error: 'modelId, provider, and displayName required'
                    }, { status: 400 })
                }

                const { error } = await supabase
                    .from('llm_config')
                    .insert({
                        provider,
                        model_id: modelId,
                        display_name: displayName,
                        priority,
                        is_enabled: true,
                        is_default: false,
                        requires_premium: false,
                        web_search_enabled: true
                    })

                if (error) {
                    return NextResponse.json({ error: 'Failed to add model' }, { status: 500 })
                }

                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
        }
    } catch (error: any) {
        console.error('[Admin LLM Config] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// Helper to get environment variable name for a provider
function getEnvKeyForProvider(provider: string): string {
    const envKeys: Record<string, string> = {
        deepseek: 'DEEPSEEK_API_KEY',
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        google: 'GOOGLE_GEMINI_API_KEY',
        groq: 'GROQ_API_KEY',
        mistral: 'MISTRAL_API_KEY',
        perplexity: 'PERPLEXITY_API_KEY'
    }
    return envKeys[provider] || ''
}
