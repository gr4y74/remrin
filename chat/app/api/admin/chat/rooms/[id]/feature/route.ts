import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Toggle feature status or set to true? Prompt says "Feature a room". Assume create/set true.
        // Or maybe body contains status? Let's assume set to true.
        // Actually usually a toggle is PATCH. But prompt says POST .../feature.
        // I will set is_featured = true.

        const { data, error } = await supabaseAdmin
            .from('chat_rooms')
            .update({ is_featured: true })
            .eq('id', params.id)
            .select()
            .single()

        if (error) throw error

        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'feature_room',
            target_type: 'room',
            target_id: params.id
        })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
