import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { status, resolution_notes } = body

        const { data, error } = await supabaseAdmin
            .from('chat_reports')
            .update({
                status: status,
                resolved_by: user.id,
                resolved_at: new Date().toISOString(),
                details: resolution_notes ? `${resolution_notes}` : undefined // Append or update details if needed
            })
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'update_report',
            target_type: 'report',
            target_id: params.id,
            details: { status, resolution_notes }
        })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
