import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status')
        const offset = (page - 1) * limit

        let query = supabaseAdmin
            .from('chat_reports')
            .select(`
                *,
                reporter:reporter_id(username),
                reported:reported_user_id(username),
                room:room_id(name)
            `, { count: 'exact' })

        if (status) {
            query = query.eq('status', status)
        }

        const { data: reports, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            reports,
            total: count,
            page,
            limit
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
