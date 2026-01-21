import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = (page - 1) * limit

        const { data: rooms, error, count } = await supabaseAdmin
            .from('chat_rooms')
            .select(`
                *,
                members:room_members(count)
            `, { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            rooms: rooms.map(r => ({
                ...r,
                member_count: r.members?.[0]?.count || 0
            })),
            total: count,
            page,
            limit
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
