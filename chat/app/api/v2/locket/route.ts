import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await request.json()
        const { content, action, personaId } = body

        if (!content || !action || !personaId) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        if (action === 'add') {
            const { error } = await supabase
                .from('persona_lockets')
                .insert({
                    persona_id: personaId,
                    content: content
                })

            if (error) throw error
            return NextResponse.json({ success: true, message: 'Truth locked.' })
        }
        else if (action === 'remove') {
            const { error } = await supabase
                .from('persona_lockets')
                .delete()
                .eq('persona_id', personaId)
                .ilike('content', content)

            if (error) throw error
            return NextResponse.json({ success: true, message: 'Truth removed.' })
        }

        return new NextResponse('Invalid action', { status: 400 })
    } catch (error) {
        console.error('[API] Locket update failed:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
