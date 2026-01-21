import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Aggregate stats
        // This is complex on Supabase without valid aggregate tables populated.
        // We will do some simple counts for now.

        // Total active rooms (rooms with members > 0? or just public rooms?)
        const { count: activeRoomsCount } = await supabaseAdmin
            .from('chat_rooms')
            .select('*', { count: 'exact', head: true })
            .eq('is_closed', false)

        // Online users (profiles with status='online' or just count from room_members?)
        // Let's use user_profiles_chat.status = 'online'
        const { count: onlineUsersCount } = await supabaseAdmin
            .from('user_profiles_chat')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'online')

        // Messages today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const { count: messagesToday } = await supabaseAdmin
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString())

        // Use analytic table if available (it might be empty initially)
        // Ignoring analytics table for now to ensure we get real-time data or fallback to counts.

        // Recent reports
        const { data: recentReports } = await supabaseAdmin
            .from('chat_reports')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5)

        // Top rooms (by member count)
        // Hard to do with simple queries. Let's fetch top 5 rooms.
        // Or fetch rooms and sort in JS if few rooms. Assuming not too many rooms for MVP.
        const { data: rooms } = await supabaseAdmin
            .from('chat_rooms')
            .select('id, name, members:room_members(count)')
            .limit(20)

        const topRooms = rooms?.map(r => ({
            id: r.id,
            name: r.name,
            member_count: r.members?.[0]?.count || 0
        })).sort((a, b) => b.member_count - a.member_count).slice(0, 5) || []

        return NextResponse.json({
            active_rooms: activeRoomsCount || 0,
            online_users: onlineUsersCount || 0,
            messages_today: messagesToday || 0,
            recent_reports: recentReports || [],
            top_rooms: topRooms
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
