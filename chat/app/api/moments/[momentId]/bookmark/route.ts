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

        // Check if bookmarked
        const { data: existing } = await supabase
            .from('moment_bookmarks')
            .select('user_id')
            .eq('user_id', user.id)
            .eq('moment_id', momentId)
            .single()

        let isBookmarked = false

        if (existing) {
            // Remove bookmark
            const { error } = await supabase
                .from('moment_bookmarks')
                .delete()
                .eq('user_id', user.id)
                .eq('moment_id', momentId)

            if (error) throw error
            isBookmarked = false
        } else {
            // Add bookmark
            const { error } = await supabase
                .from('moment_bookmarks')
                .insert({
                    user_id: user.id,
                    moment_id: momentId
                })

            if (error) throw error
            isBookmarked = true
        }

        return NextResponse.json({ isBookmarked })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
