import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'
import { logAdminAction } from '@/lib/admin/audit'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check if unban or ban (users/[id]/unban is separate route in prompt, but here is ban)
        const { data, error } = await supabaseAdmin
            .from('user_profiles_chat')
            .update({ is_banned: true })
            .eq('user_id', params.id)
            .select()
            .single()

        if (error) throw error

        // Global Audit Logging (Layer 3)
        await logAdminAction(user.id, 'ban_user', params.id, { reason: 'Admin Action' })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
