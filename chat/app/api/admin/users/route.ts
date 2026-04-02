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
        // Authorization check: Either Supabase session OR Admin Password header
        const authHeader = request.headers.get('authorization')
        const adminPasswordHeader = request.headers.get('x-admin-password')
        const serverAdminPassword = process.env.ADMIN_PASSWORD

        let isAuthorized = false
        let currentUser: any = null

        // Priority 1: Admin Password (e.g. from the AdminPasswordGate)
        if (adminPasswordHeader && serverAdminPassword && adminPasswordHeader === serverAdminPassword) {
            isAuthorized = true
        } 
        // Priority 2: Supabase Session
        else if (authHeader) {
            const token = authHeader.replace('Bearer ', '')
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            if (user && (await isAdmin(user.id))) {
                isAuthorized = true
                currentUser = user
            }
        }

        if (!isAuthorized) {
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
        // We query profiles first for base data and pagination
        let query = supabaseAdmin
            .from('profiles')
            .select('user_id, is_admin, created_at', { count: 'exact' })

        // Apply tier filter (tier is in wallets)
        if (tier && tier !== 'all') {
            const { data: walletUserIds } = await supabaseAdmin
                .from('wallets')
                .select('user_id')
                .eq('tier', tier)
            
            const ids = walletUserIds?.map(w => w.user_id) || []
            query = query.in('user_id', ids)
        }

        // Apply search filter (username/display_name are in user_profiles)
        if (search) {
            const { data: profileUserIds } = await supabaseAdmin
                .from('user_profiles')
                .select('user_id')
                .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
            
            const ids = profileUserIds?.map(p => p.user_id) || []
            query = query.in('user_id', ids)
        }

        // Apply sorting (profiles table columns)
        if (sortBy === 'created_at') {
            query = query.order('created_at', { ascending: sortOrder === 'asc' })
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data: profiles, error: queryError, count } = await query

        if (queryError) {
            console.error('Error fetching profiles:', queryError)
            return NextResponse.json({ error: 'Failed to fetch profiles: ' + queryError.message }, { status: 500 })
        }

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({
                users: [],
                total: count || 0,
                stats: { total: count || 0, active: count || 0, suspended: 0, banned: 0 }
            })
        }

        const userIds = profiles.map(p => p.user_id)

        // Fetch related data in parallel for the current page users
        const [userProfilesResponse, walletsResponse, authUsersResponse] = await Promise.all([
            supabaseAdmin.from('user_profiles').select('*').in('user_id', userIds),
            supabaseAdmin.from('wallets').select('*').in('user_id', userIds),
            supabaseAdmin.auth.admin.listUsers()
        ])

        const userProfiles = userProfilesResponse.data || []
        const wallets = walletsResponse.data || []
        const authUsers = authUsersResponse.data?.users || []

        // Formatted users list
        const users = profiles.map(p => {
            const authUser = authUsers.find(u => u.id === p.user_id)
            const userProfile = userProfiles.find(up => up.user_id === p.user_id)
            const wallet = wallets.find(w => w.user_id === p.user_id)

            return {
                id: p.user_id,
                email: authUser?.email || 'N/A',
                username: userProfile?.username || 'unknown',
                display_name: userProfile?.display_name || '',
                avatar_url: userProfile?.avatar_url || '',
                bio: userProfile?.bio || '',
                created_at: p.created_at,
                last_sign_in_at: authUser?.last_sign_in_at || null,
                balance_aether: wallet?.balance_aether || 0,
                balance_brain: wallet?.balance_brain || 0,
                total_earned: wallet?.total_earned || 0,
                total_spent: wallet?.total_spent || 0,
                tier: wallet?.tier || 'wanderer',
                status: 'active',
                is_admin: p.is_admin || false
            }
        })

        // Fetch global stats (only total count as status columns are missing)
        const { count: totalCount } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        const statsData = {
            total: totalCount || 0,
            active: totalCount || 0,
            suspended: 0,
            banned: 0
        }

        return NextResponse.json({
            users,
            total: count || 0,
            stats: statsData,
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
