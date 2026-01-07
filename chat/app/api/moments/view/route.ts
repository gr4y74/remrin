import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const { momentId } = await request.json()

        if (!momentId) {
            return NextResponse.json({ error: 'Missing momentId' }, { status: 400 })
        }

        // Increment view count
        const { error } = await supabase.rpc('increment_moment_views', {
            moment_id: momentId
        })

        if (error) {
            console.error('View tracking error:', error)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('View tracking error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
