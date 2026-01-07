import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { momentId, emoji, action } = await request.json()

        if (!momentId || !emoji || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (action === 'add') {
            const { error } = await supabase
                .from('moment_reactions')
                .insert({
                    moment_id: momentId,
                    user_id: user.id,
                    reaction_emoji: emoji
                })

            if (error && error.code !== '23505') { // Ignore duplicate
                return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
            }
        } else if (action === 'remove') {
            const { error } = await supabase
                .from('moment_reactions')
                .delete()
                .eq('moment_id', momentId)
                .eq('user_id', user.id)
                .eq('reaction_emoji', emoji)

            if (error) {
                return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 })
            }
        }

        // Fetch updated moment with reactions
        const { data: moment } = await supabase
            .from('moments')
            .select('reactions_summary')
            .eq('id', momentId)
            .single()

        return NextResponse.json({ success: true, reactions: moment?.reactions_summary || {} })
    } catch (error) {
        console.error('Reaction error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
