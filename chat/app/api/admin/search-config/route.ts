import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/search-config
 * Fetch all search provider configurations
 */
export async function GET(req: NextRequest) {
    try {
        // Verify admin authentication
        const adminPassword = req.headers.get('x-admin-password')
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('search_provider_config')
            .select('*')
            .order('priority', { ascending: true })

        if (error) {
            console.error('[Admin] Error fetching search config:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ providers: data })
    } catch (error) {
        console.error('[Admin] Search config GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/search-config
 * Update search provider settings
 */
export async function POST(req: NextRequest) {
    try {
        // Verify admin authentication
        const adminPassword = req.headers.get('x-admin-password')
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { provider_name, api_key, rate_limit, max_results, search_depth } = body

        if (!provider_name) {
            return NextResponse.json(
                { error: 'provider_name is required' },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        // Build update object
        const updateData: any = {}
        if (api_key !== undefined) updateData.api_key_encrypted = api_key
        if (rate_limit !== undefined) updateData.rate_limit = rate_limit
        if (max_results !== undefined) updateData.max_results = max_results
        if (search_depth !== undefined) updateData.search_depth = search_depth

        const { data, error } = await supabase
            .from('search_provider_config')
            .update(updateData)
            .eq('provider_name', provider_name)
            .select()
            .single()

        if (error) {
            console.error('[Admin] Error updating search config:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ provider: data })
    } catch (error) {
        console.error('[Admin] Search config POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/admin/search-config
 * Enable/disable providers
 */
export async function PUT(req: NextRequest) {
    try {
        // Verify admin authentication
        const adminPassword = req.headers.get('x-admin-password')
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { provider_name, enabled, priority } = body

        if (!provider_name) {
            return NextResponse.json(
                { error: 'provider_name is required' },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        const updateData: any = {}
        if (enabled !== undefined) updateData.enabled = enabled
        if (priority !== undefined) updateData.priority = priority

        const { data, error } = await supabase
            .from('search_provider_config')
            .update(updateData)
            .eq('provider_name', provider_name)
            .select()
            .single()

        if (error) {
            console.error('[Admin] Error toggling provider:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ provider: data })
    } catch (error) {
        console.error('[Admin] Search config PUT error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/search-config
 * Remove provider API keys
 */
export async function DELETE(req: NextRequest) {
    try {
        // Verify admin authentication
        const adminPassword = req.headers.get('x-admin-password')
        if (adminPassword !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const provider_name = searchParams.get('provider_name')

        if (!provider_name) {
            return NextResponse.json(
                { error: 'provider_name is required' },
                { status: 400 }
            )
        }

        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('search_provider_config')
            .update({ api_key_encrypted: null })
            .eq('provider_name', provider_name)
            .select()
            .single()

        if (error) {
            console.error('[Admin] Error removing API key:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ provider: data })
    } catch (error) {
        console.error('[Admin] Search config DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
