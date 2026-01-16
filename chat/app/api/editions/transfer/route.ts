import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { ownership_id, to_user_id, transfer_type, price, signature } = body

        if (!ownership_id || !to_user_id || !transfer_type) {
            return NextResponse.json({
                error: 'Missing required fields: ownership_id, to_user_id, transfer_type'
            }, { status: 400 })
        }

        // Call the transfer_ownership function
        const { data, error } = await supabase.rpc('transfer_ownership', {
            p_ownership_id: ownership_id,
            p_from_user_id: user.id,
            p_to_user_id: to_user_id,
            p_transfer_type: transfer_type,
            p_price: price || null,
            p_signature: signature || null
        })

        if (error) {
            console.error('Transfer error:', error)
            return NextResponse.json({
                error: error.message || 'Failed to transfer ownership'
            }, { status: 400 })
        }

        // Get the transfer record
        const { data: transfer, error: transferError } = await supabase
            .from('asset_transfer_history')
            .select(`
                *,
                ownership:digital_asset_ownership(
                    *,
                    edition:digital_asset_editions(*)
                )
            `)
            .eq('id', data)
            .single()

        if (transferError) {
            console.error('Transfer fetch error:', transferError)
            return NextResponse.json({
                error: 'Transfer completed but failed to fetch details'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            transfer_id: data,
            transfer
        })

    } catch (error: any) {
        console.error('Transfer endpoint error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
