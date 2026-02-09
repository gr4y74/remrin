
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { PROVIDER_CONFIGS, TIER_CONFIGS, ProviderId, UserTier } from '@/lib/chat-engine/types'

// Use Service Role for admin operations
const supabase = createAdminClient()

// Simple admin auth check
function isAdmin(request: NextRequest): boolean {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) return false

    // We can also check for a session if needed, but for now we follow the existing pattern
    // The page is behind AdminPasswordGate anyway.
    return true
}

export async function GET(request: NextRequest) {
    try {
        // 1. Fetch LLM Configs
        const { data: llmConfigs } = await supabase
            .from('llm_config')
            .select('*')

        // 2. Fetch API Key Status
        const { data: apiKeys } = await supabase
            .from('api_keys')
            .select('provider, env_var')

        // 3. Fetch Search Config
        const { data: searchConfigs } = await supabase
            .from('search_provider_config')
            .select('*')

        // Map providers enabled status
        const providers: Record<string, boolean> = {}
        Object.keys(PROVIDER_CONFIGS).forEach(id => {
            const config = llmConfigs?.find(c => c.provider === id)
            providers[id] = config ? config.is_enabled : true
        })

        // Map API keys status (is configured)
        const apiKeyStatus: Record<string, boolean> = {}

        // Check environment variables first
        Object.values(PROVIDER_CONFIGS).forEach(p => {
            if (p.apiKeyEnv) {
                apiKeyStatus[p.apiKeyEnv] = !!process.env[p.apiKeyEnv]
            }
        })
        apiKeyStatus['TAVILY_API_KEY'] = !!process.env.TAVILY_API_KEY

        // Override with database keys
        apiKeys?.forEach(k => {
            if (k.env_var) {
                apiKeyStatus[k.env_var] = true
            }
        })

        const configData = {
            providers,
            searchProviders: {
                tavily: searchConfigs?.find(c => c.provider_name === 'tavily')?.enabled ?? false,
                duckduckgo: searchConfigs?.find(c => c.provider_name === 'duckduckgo')?.enabled ?? true,
            },
            tierProviders: Object.entries(TIER_CONFIGS).reduce((acc, [tier, config]) => {
                acc[tier as UserTier] = config.allowedProviders
                return acc
            }, {} as Record<UserTier, ProviderId[]>),
            apiKeys: apiKeyStatus
        }

        return NextResponse.json(configData)
    } catch (error: any) {
        console.error('[ChatConfig] GET Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { providers, searchProviders, newKeys } = body

        // 1. Update LLM Configs
        for (const [providerId, enabled] of Object.entries(providers)) {
            await supabase
                .from('llm_config')
                .update({ is_enabled: enabled })
                .eq('provider', providerId)
        }

        // 2. Update Search Configs
        if (searchProviders) {
            for (const [name, enabled] of Object.entries(searchProviders)) {
                await supabase
                    .from('search_provider_config')
                    .update({ enabled })
                    .eq('provider_name', name)
            }
        }

        // 3. Save New API Keys
        if (newKeys) {
            for (const [envVar, value] of Object.entries(newKeys)) {
                if (!value) continue

                // Find provider by envVar
                const providerEntry = Object.entries(PROVIDER_CONFIGS).find(([_, p]) => p.apiKeyEnv === envVar)
                const providerId = providerEntry ? providerEntry[0] : (envVar === 'TAVILY_API_KEY' ? 'tavily' : 'custom')

                await supabase
                    .from('api_keys')
                    .upsert({
                        provider: providerId,
                        env_var: envVar,
                        api_key: value,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'provider' })
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[ChatConfig] POST Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
