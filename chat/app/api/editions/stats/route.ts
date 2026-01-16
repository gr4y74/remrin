import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = createClient()
        const { searchParams } = new URL(request.url)
        const editionId = searchParams.get('edition_id')

        if (!editionId) {
            return NextResponse.json({ error: 'Edition ID is required' }, { status: 400 })
        }

        // Get edition stats
        const { data, error } = await supabase.rpc('get_edition_stats', {
            p_edition_id: editionId
        })

        if (error) {
            console.error('Stats error:', error)
            return NextResponse.json({
                error: error.message || 'Failed to get edition stats'
            }, { status: 400 })
        }

        return NextResponse.json({
            success: true,
            stats: data?.[0] || null
        })

    } catch (error: any) {
        console.error('Stats endpoint error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
