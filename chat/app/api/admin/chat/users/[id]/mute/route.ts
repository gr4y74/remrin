import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabaseAdmin
            .from('user_profiles_chat')
            .update({ is_muted: true })
            .eq('user_id', params.id)
            .select()
            .single()

        if (error) throw error

        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'mute_user',
            target_type: 'user',
            target_id: params.id
        })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
