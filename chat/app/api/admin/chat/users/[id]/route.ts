import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles_chat')
            .select('*')
            .eq('user_id', params.id)
            .single()

        if (error) throw error

        // Get stats
        const { count: message_count } = await supabaseAdmin
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', params.id)

        const { count: report_count } = await supabaseAdmin
            .from('chat_reports')
            .select('*', { count: 'exact', head: true })
            .eq('reported_user_id', params.id)

        // Rooms joined?
        const { data: rooms_joined } = await supabaseAdmin
            .from('room_members')
            .select('room_id, chat_rooms(name)')
            .eq('user_id', params.id)

        return NextResponse.json({
            ...profile,
            stats: {
                messages_sent: message_count || 0,
                reports_received: report_count || 0,
                rooms_joined_count: rooms_joined?.length || 0,
                rooms: rooms_joined?.map((r: any) => r.chat_rooms?.name) || []
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
