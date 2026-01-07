import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
    request: NextRequest,
    { params }: { params: { momentId: string } }
) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        const { momentId } = params

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json().catch(() => ({}))
        const { platform = 'copy_link' } = body

        // Track share
        const { error } = await supabase
            .from('moment_shares')
            .insert({
                user_id: user.id,
                moment_id: momentId,
                platform: platform
            })

        if (error) {
            // Log but don't fail hard if tracking fails?
            console.error('Share tracking error:', error)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
