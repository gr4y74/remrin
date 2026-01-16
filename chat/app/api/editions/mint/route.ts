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
        const { edition_id, purchase_id, purchase_price } = body

        if (!edition_id) {
            return NextResponse.json({ error: 'Edition ID is required' }, { status: 400 })
        }

        // Call the mint_edition function
        const { data, error } = await supabase.rpc('mint_edition', {
            p_edition_id: edition_id,
            p_owner_id: user.id,
            p_purchase_id: purchase_id || null,
            p_purchase_price: purchase_price || null
        })

        if (error) {
            console.error('Mint error:', error)
            return NextResponse.json({
                error: error.message || 'Failed to mint edition'
            }, { status: 400 })
        }

        // Get the ownership record
        const { data: ownership, error: ownershipError } = await supabase
            .from('digital_asset_ownership')
            .select(`
                *,
                edition:digital_asset_editions(*)
            `)
            .eq('id', data)
            .single()

        if (ownershipError) {
            console.error('Ownership fetch error:', ownershipError)
            return NextResponse.json({
                error: 'Edition minted but failed to fetch details'
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            ownership_id: data,
            ownership
        })

    } catch (error: any) {
        console.error('Mint endpoint error:', error)
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
