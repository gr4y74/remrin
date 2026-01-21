import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, supabaseAdmin } from '@/lib/admin/chat-auth'

export async function GET(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabaseAdmin
            .from('chat_settings')
            .select('*')
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 is no rows

        if (!data) {
            // Return defaults if no row
            return NextResponse.json({
                max_message_length: 500,
                rate_limit_seconds: 1,
                allowed_file_types: ['image/png', 'image/jpeg', 'image/gif'],
                profanity_filter_level: 'standard',
                auto_moderation_enabled: true
            })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await authorizeAdmin(request.headers.get('authorization'))
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()

        const { data, error } = await supabaseAdmin
            .from('chat_settings')
            .upsert({ id: 1, ...body, updated_at: new Date().toISOString() })
            .select()
            .single()

        if (error) throw error

        await supabaseAdmin.from('chat_admin_logs').insert({
            admin_id: user.id,
            action: 'update_settings',
            target_type: 'settings',
            target_id: null,
            details: body
        })

        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
