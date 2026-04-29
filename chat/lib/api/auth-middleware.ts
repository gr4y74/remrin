import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface AuthContext {
    userId: string;
    tenantId: string | null;
    isSandbox: boolean;
}

// Sandbox mock tenant UUID
const SANDBOX_TENANT_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Validates API key or falls back to cookie auth
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthContext | null> {
    const authHeader = request.headers.get('Authorization')

    if (authHeader && authHeader.startsWith('Bearer rmrn_')) {
        const token = authHeader.split(' ')[1]
        const isSandbox = token.startsWith('rmrn_sk_')

        // Hash the key using Web Crypto API
        const encoder = new TextEncoder()
        const data = encoder.encode(token)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const supabase = createAdminClient()

        // Lookup key (both production and sandbox)
        const { data: apiKey, error } = await supabase
            .from('tenant_api_keys')
            .select('tenant_id, is_active, expires_at, tenants (owner_user_id, plan)')
            .eq('key_hash', keyHash)
            .single()

        if (error || !apiKey || !apiKey.is_active) {
            console.error("[Auth] Invalid or inactive API key")
            return null
        }

        // Check expiration
        if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
            console.error("[Auth] API key expired")
            return null
        }

        // Track last used asynchronously
        supabase.from('tenant_api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('key_hash', keyHash)
            .then()

        return {
            userId: (apiKey.tenants as any)?.owner_user_id || 'api_user',
            tenantId: apiKey.tenant_id,
            isSandbox: isSandbox || (apiKey.tenants as any)?.plan === 'sandbox'
        }
    }

    // Fall through to cookie auth
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { session } } = await supabase.auth.getSession()
    let user = session?.user || null

    if (!user) {
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]
            const { data: { user: verifiedUser } } = await supabase.auth.getUser(token)
            user = verifiedUser
        }
    }

    if (!user) {
        const { data: { user: verifiedUser } } = await supabase.auth.getUser()
        user = verifiedUser
    }

    if (!user) return null

    return {
        userId: user.id,
        tenantId: null, // Personal user, no tenant context
        isSandbox: false
    }
}
