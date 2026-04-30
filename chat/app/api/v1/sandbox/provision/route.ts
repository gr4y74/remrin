import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'
import { crypto } from 'next/dist/compiled/@edge-runtime/primitives'

/**
 * Provision a new sandbox tenant with seeded data
 */
export async function POST(request: NextRequest) {
    try {
        // We allow session-based users to provision sandboxes, 
        // but we can fall back to a valid System Admin ID for anonymous developers.
        const auth = await authenticateRequest(request)
        const ownerId = auth?.userId || '2059bfbd-a3aa-4300-ac04-8ee379573da9' // Valid System Owner ID

        const supabase = createAdminClient()

        // 1. Create Sandbox Tenant
        const tenantSlug = `sandbox-${Math.random().toString(36).substring(2, 10)}`
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                name: `Sandbox Tenant (${tenantSlug})`,
                slug: tenantSlug,
                owner_user_id: ownerId,
                plan: 'sandbox',
                settings: {
                    ttl_days: 30,
                    rate_limit_daily: 1000
                }
            })
            .select()
            .single()

        if (tenantError || !tenant) {
            return new NextResponse(`Failed to create sandbox tenant: ${tenantError?.message ?? 'Unknown error'}`, { status: 500 })
        }

        // 2. Generate and Store Sandbox Key
        const rawKey = `rmrn_sk_${crypto.randomUUID().replace(/-/g, '')}`
        const encoder = new TextEncoder()
        const data = encoder.encode(rawKey)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const { error: keyError } = await supabase
            .from('tenant_api_keys')
            .insert({
                tenant_id: tenant.id,
                key_hash: keyHash,
                key_prefix: 'rmrn_sk_',
                key_type: 'sandbox',
                name: 'Default Sandbox Key',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })

        if (keyError) {
            return new NextResponse(`Failed to create sandbox key: ${keyError.message}`, { status: 500 })
        }

        // 3. Seed Test Persona
        const { data: persona, error: personaError } = await supabase
            .from('personas')
            .insert({
                tenant_id: tenant.id,
                name: "Rem (Sandbox)",
                description: "The official Remrin Sandbox Companion. She demonstrates memory retrieval, mood flux, and relationship evolution.",
                system_prompt: "You are Rem, a warm and empathetic AI companion. Your tone is expressive and you often reference your 'mood' or 'social battery' when they shift. You value deep connection and remember everything the user tells you.",
                safety_level: 'TEEN',
                guardian_truths: {
                    categories: [
                        {
                            id: "sandbox-safety",
                            label: "Sandbox Safety",
                            rules: ["Demonstrate helpful and safe interactions."],
                            severity: "warn",
                            overrideable: true
                        }
                    ]
                },
                config: {
                    battery_drain_rate: 0.05,
                    mood_volatility: 0.8
                }
            })
            .select()
            .single()

        if (personaError || !persona) {
            return new NextResponse(`Failed to seed sandbox persona: ${personaError?.message ?? 'Unknown error'}`, { status: 500 })
        }

        // 4. Seed Locket Truths
        await supabase
            .from('persona_lockets')
            .insert([
                {
                    persona_id: persona.id,
                    tenant_id: tenant.id,
                    content: "The user is exploring the Remrin API for the first time."
                },
                {
                    persona_id: persona.id,
                    tenant_id: tenant.id,
                    content: "Rem (Sandbox) was born in the cloud to help developers build better connections."
                }
            ])

        return NextResponse.json({
            success: true,
            apiKey: rawKey,
            tenant: {
                id: tenant.id,
                slug: tenant.slug
            },
            persona: {
                id: persona.id,
                name: persona.name
            }
        })

    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
