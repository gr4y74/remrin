/**
 * Chat Engine Configuration API
 * 
 * GET: Return current configuration
 * POST: Update configuration (save to Supabase or env)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PROVIDER_CONFIGS, ProviderId } from '@/lib/chat-engine/types'

/**
 * GET - Fetch current chat engine configuration
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient()

        // 1. Fetch LLM configurations
        const { data: llmConfigs, error: llmError } = await supabase
            .from('llm_config')
            .select('*')
            .order('priority', { ascending: false })

        if (llmError) throw llmError

        // 2. Fetch API keys status (don't return actual keys here, just if they are set)
        const { data: apiKeys, error: keysError } = await supabase
            .from('api_keys')
            .select('provider, env_var')

        if (keysError) throw keysError

        // Build status map
        const providerStatus: Record<string, boolean> = {}
        llmConfigs?.forEach(cfg => {
            providerStatus[cfg.provider] = cfg.is_enabled
        })

        const keysStatus: Record<string, boolean> = {}
        // Check env vars first
        Object.values(PROVIDER_CONFIGS).forEach(p => {
            if (p.apiKeyEnv) {
                keysStatus[p.apiKeyEnv] = !!process.env[p.apiKeyEnv]
            }
        })
        // Then override with DB keys
        apiKeys?.forEach(k => {
            keysStatus[k.env_var] = true
        })

        // Build configuration response
        const config = {
            providers: providerStatus,
            searchProviders: {
                tavily: !!process.env.TAVILY_API_KEY || !!keysStatus['TAVILY_API_KEY'],
                duckduckgo: true
            },
            tierProviders: {
                free: ['openrouter'],
                pro: ['openrouter', 'deepseek', 'claude'],
                premium: ['openrouter', 'deepseek', 'claude', 'gemini'],
                enterprise: ['openrouter', 'deepseek', 'claude', 'gemini', 'custom']
            },
            apiKeys: keysStatus
        }

        return NextResponse.json(config)
    } catch (error: any) {
        console.error('Error fetching chat engine config:', error)
        return NextResponse.json(
            { error: 'Failed to fetch configuration' },
            { status: 500 }
        )
    }
}

/**
 * POST - Update chat engine configuration
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const supabase = createAdminClient()

        // Validate the request body
        if (!body.providers) { // minimal validation
            return NextResponse.json(
                { error: 'Invalid configuration data' },
                { status: 400 }
            )
        }

        // 1. Update provider enablement in llm_config
        for (const [providerId, isEnabled] of Object.entries(body.providers)) {
            const { error: updateError } = await supabase
                .from('llm_config')
                .update({ is_enabled: isEnabled })
                .eq('provider', providerId)

            if (updateError) {
                console.warn(`Failed to update ${providerId} status:`, updateError.message)
            }
        }

        // 2. If new API keys were provided, save them (simplified for now)
        // In a real scenario, you'd send { apiKeys: { PROVIDER: "key" } }
        if (body.newKeys) {
            for (const [envVar, apiKey] of Object.entries(body.newKeys)) {
                if (!apiKey) continue

                // Find provider by envVar
                const providerEntry = Object.values(PROVIDER_CONFIGS).find(p => p.apiKeyEnv === envVar)
                const providerId = providerEntry?.id || 'custom'

                const { error: keyError } = await supabase
                    .from('api_keys')
                    .upsert({
                        provider: providerId,
                        env_var: envVar,
                        api_key: apiKey as string,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'provider' })

                if (keyError) {
                    console.error(`Failed to save key for ${providerId}:`, keyError.message)
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Configuration updated successfully'
        })
    } catch (error: any) {
        console.error('Error updating chat engine config:', error)
        return NextResponse.json(
            { error: 'Failed to update configuration' },
            { status: 500 }
        )
    }
}
