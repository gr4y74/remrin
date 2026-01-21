import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { error } = await supabaseAdmin
            .from('chat_messages')
            .delete()
            .eq('id', params.id)

        if (error) throw error

        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'delete_message',
            target_type: 'message',
            target_id: params.id
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
