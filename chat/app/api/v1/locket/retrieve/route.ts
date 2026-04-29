import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if (!auth) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const url = new URL(request.url)
        const personaId = url.searchParams.get('personaId')

        if (!personaId) {
            return new NextResponse('Missing personaId parameter', { status: 400 })
        }

        const supabase = createAdminClient()

        let query = supabase
            .from('persona_lockets')
            .select('*')
            .eq('persona_id', personaId)

        if (auth.tenantId && !auth.isSandbox) {
            query = query.eq('tenant_id', auth.tenantId)
        } else if (!auth.isSandbox) {
            query = query.is('tenant_id', null)
        }

        const { data: lockets, error } = await query

        if (error) {
            return new NextResponse(`Error retrieving lockets: ${error.message}`, { status: 500 })
        }

        return NextResponse.json({ lockets: lockets || [] })
    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
