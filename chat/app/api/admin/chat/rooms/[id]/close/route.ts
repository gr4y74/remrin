import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabaseAdmin
            .from('chat_rooms')
            .update({ is_closed: true }) // using is_closed from my edit
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'close_room',
            target_type: 'room',
            target_id: params.id
        })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
