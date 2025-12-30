import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

// Mapping of providers to environment variable names
const ENV_VAR_MAP: Record<string, string> = {
    deepseek: 'DEEPSEEK_API_KEY',
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_GEMINI_API_KEY',
    groq: 'GROQ_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
}

export async function POST(request: Request) {
    try {
        // Verify admin password
        const authHeader = request.headers.get('Authorization')
        const password = authHeader?.replace('Bearer ', '')

        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { provider, envVar, apiKey } = await request.json()

        if (!provider || !apiKey) {
            return NextResponse.json({ error: 'Missing provider or apiKey' }, { status: 400 })
        }

        // Validate the provider is known
        if (!ENV_VAR_MAP[provider]) {
            return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
        }

        // Store the API key in Supabase (encrypted storage)
        // This allows us to manage keys without redeploying
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Upsert the API key in a secure table
        const { error: upsertError } = await supabase
            .from('api_keys')
            .upsert({
                provider,
                env_var: envVar,
                api_key: apiKey,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'provider'
            })

        if (upsertError) {
            // If table doesn't exist, create it
            if (upsertError.code === '42P01') {
                return NextResponse.json({
                    error: 'API keys table not found. Run migration first.',
                    details: 'Create table api_keys (id uuid, provider text unique, env_var text, api_key text, updated_at timestamptz)'
                }, { status: 500 })
            }
            console.error('Error saving API key:', upsertError)
            return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
        }

        // Also update the llm_config table to mark the key as configured
        await supabase
            .from('llm_config')
            .update({ api_key_configured: true })
            .eq('provider', provider)

        return NextResponse.json({
            success: true,
            message: `API key for ${provider} saved successfully`
        })

    } catch (error) {
        console.error('API keys error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        // Verify admin password
        const { searchParams } = new URL(request.url)
        const password = searchParams.get('password')

        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get configured status for each provider (not the actual keys)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: keys } = await supabase
            .from('api_keys')
            .select('provider, updated_at')

        const configured = (keys || []).reduce((acc, k) => {
            acc[k.provider] = { configured: true, updated_at: k.updated_at }
            return acc
        }, {} as Record<string, { configured: boolean; updated_at: string }>)

        return NextResponse.json({ providers: configured })

    } catch (error) {
        console.error('API keys error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
