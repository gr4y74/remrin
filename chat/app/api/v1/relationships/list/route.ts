import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { authenticateRequest } from '@/lib/api/auth-middleware'

export async function GET(request: NextRequest) {
    try {
        const auth = await authenticateRequest(request)
        if (!auth || !auth.tenantId) {
            return new NextResponse('Unauthorized — tenant required', { status: 401 })
        }

        const url = new URL(request.url)
        const userId = url.searchParams.get('userId')

        if (!userId) {
            return new NextResponse('Missing userId parameter', { status: 400 })
        }

        const supabase = createAdminClient()

        const { data: relationships, error } = await supabase
            .from('user_relationships')
            .select('*')
            .eq('tenant_id', auth.tenantId)
            .or(`user_a.eq.${userId},user_b.eq.${userId}`)
            .order('created_at', { ascending: false })

        if (error) {
            return new NextResponse(`Error listing relationships: ${error.message}`, { status: 500 })
        }

        return NextResponse.json({ relationships: relationships ?? [] })
    } catch (error: any) {
        return new NextResponse(`Internal Error: ${error.message}`, { status: 500 })
    }
}
