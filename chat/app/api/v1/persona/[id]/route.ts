import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const auth = await authenticateRequest(request)
        if (!auth) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const supabase = createAdminClient()

        let query = supabase
            .from('personas')
            .select('*')
            .eq('id', params.id)
            
        if (auth.tenantId && !auth.isSandbox) {
            // Apply tenant isolation
            query = query.eq('tenant_id', auth.tenantId)
        } else if (!auth.isSandbox) {
            // Personal user, can only access public or their own (fallback logic)
            query = query.is('tenant_id', null)
        }

        const { data: persona, error } = await query.single()

        if (error || !persona) {
            return new NextResponse('Persona not found', { status: 404 })
        }

        return NextResponse.json({ persona })
    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
