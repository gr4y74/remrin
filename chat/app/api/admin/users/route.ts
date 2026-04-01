import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service role to bypass RLS for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

// Helper to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single()

    return data?.is_admin === true
}

export async function GET(request: NextRequest) {
    try {
        // Get current user from auth header
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        // Parse query parameters
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const tier = searchParams.get('tier') || ''
        const sortBy = searchParams.get('sortBy') || 'created_at'
        const sortOrder = searchParams.get('sortOrder') || 'desc'

        const offset = (page - 1) * limit

        // Build main query for users
        // Base table is profiles since it contains tier and status
        let query = supabaseAdmin
            .from('profiles')
            .select(`
                user_id,
                tier,
                status,
                is_admin,
                created_at,
                user_profiles:user_profiles!inner (
                    username,
                    display_name,
                    avatar_url,
                    bio
                ),
                wallets:wallets (
                    balance_aether,
                    balance_brain,
                    total_earned,
                    total_spent
                )
            `, { count: 'exact' })

        // Apply filters
        if (status && status !== 'all') {
            query = query.eq('status', status)
        }
        if (tier && tier !== 'all') {
            query = query.eq('tier', tier)
        }

        // Apply search filter (on joined user_profiles table)
        if (search) {
            query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`, { foreignTable: 'user_profiles' })
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data: results, error: queryError, count } = await query

        if (queryError) {
            console.error('Error fetching users:', queryError)
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
        }

        // Fetch auth users data for emails and last sign in
        const userIds = results?.map(r => r.user_id) || []
        
        // We fetch auth users in chunks or use listUsers and filter
        // Since listUsers is limited, we'll try to get individual users if possible, 
        // but for admin dashboard, listUsers with pagination is better if we could.
        // However, we only need emails for the current page.
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
        const authUsers = authData?.users || []

        // Formatted users list
        const users = results?.map(result => {
            const authUser = authUsers.find(u => u.id === result.user_id)
            const profile = result.user_profiles?.[0] || result.user_profiles // Handle single vs array depending on join result
            const wallet = result.wallets?.[0] || result.wallets

            return {
                id: result.user_id,
                email: authUser?.email || 'N/A',
                username: profile?.username || 'unknown',
                display_name: profile?.display_name || '',
                avatar_url: profile?.avatar_url || '',
                bio: profile?.bio || '',
                created_at: result.created_at,
                last_sign_in_at: authUser?.last_sign_in_at || null,
                balance_aether: wallet?.balance_aether || 0,
                balance_brain: wallet?.balance_brain || 0,
                total_earned: wallet?.total_earned || 0,
                total_spent: wallet?.total_spent || 0,
                tier: result.tier || 'wanderer',
                status: result.status || 'active',
                is_admin: result.is_admin || false
            }
        }) || []

        // Fetch global stats
        const [
            { count: totalCount },
            { count: activeCount },
            { count: suspendedCount },
            { count: bannedCount }
        ] = await Promise.all([
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
            supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'banned')
        ])

        return NextResponse.json({
            users,
            total: count || 0,
            stats: {
                total: totalCount || 0,
                active: activeCount || 0,
                suspended: suspendedCount || 0,
                banned: bannedCount || 0
            },
            page,
            limit
        })

    } catch (error: any) {
        console.error('Error in GET /api/admin/users:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
