import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const queryText = searchParams.get('q') || ''
        const roomId = searchParams.get('roomId')
        const userId = searchParams.get('userId')
        const offset = (page - 1) * limit

        let query = supabaseAdmin
            .from('chat_messages')
            .select(`
                *,
                room:room_id(name),
                user:user_id(username)
            `, { count: 'exact' })

        if (queryText) {
            query = query.ilike('message', `%${queryText}%`)
        }
        if (roomId) {
            query = query.eq('room_id', roomId)
        }
        if (userId) {
            query = query.eq('user_id', userId)
        }

        const { data: messages, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json({
            messages,
            total: count,
            page,
            limit
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
