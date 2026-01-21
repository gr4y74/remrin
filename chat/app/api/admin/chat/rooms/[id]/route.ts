import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: room, error } = await supabaseAdmin
            .from('chat_rooms')
            .select('*')
            .eq('id', params.id)
            .single()

        if (error) throw error
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

        return NextResponse.json(room)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { data, error } = await supabaseAdmin
            .from('chat_rooms')
            .update(body)
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        // Log action
        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'update_room',
            target_type: 'room',
            target_id: params.id,
            details: body
        })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { error } = await supabaseAdmin
            .from('chat_rooms')
            .delete()
            .eq('id', params.id)

        if (error) throw error

        // Log action
        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'delete_room',
            target_type: 'room',
            target_id: params.id
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
