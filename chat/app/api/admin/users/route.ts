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

        // Build query for users with profiles and wallets
        let query = supabaseAdmin
            .from('user_profiles')
            .select(`
        id,
        user_id,
        username,
        display_name,
        avatar_url,
        bio,
        created_at,
        updated_at
      `, { count: 'exact' })

        // Apply search filter
        if (search) {
            query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
        }

        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })

        // Apply pagination
        query = query.range(offset, offset + limit - 1)

        const { data: profiles, error: profilesError, count } = await query

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError)
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
        }

        // Fetch auth users data
        const userIds = profiles?.map(p => p.user_id) || []
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
        const authUsers = authData?.users || []

        // Fetch wallets data
        const { data: wallets } = await supabaseAdmin
            .from('wallets')
            .select('user_id, balance_aether, balance_brain, total_earned, total_spent')
            .in('user_id', userIds)

        // Fetch profiles data for tier/status
        const { data: internalProfiles } = await supabaseAdmin
            .from('profiles')
            .select('user_id, tier, status')
            .in('user_id', userIds)

        // Combine data
        const users = profiles?.map(profile => {
            const authUser = authUsers.find(u => u.id === profile.user_id)
            const wallet = wallets?.find(w => w.user_id === profile.user_id)
            const internalProfile = internalProfiles?.find(p => p.user_id === profile.user_id)

            return {
                id: profile.user_id,
                email: authUser?.email || '',
                username: profile.username,
                display_name: profile.display_name || '',
                avatar_url: profile.avatar_url || '',
                bio: profile.bio || '',
                created_at: authUser?.created_at || profile.created_at,
                last_sign_in_at: authUser?.last_sign_in_at || null,
                balance_aether: wallet?.balance_aether || 0,
                balance_brain: wallet?.balance_brain || 0,
                total_earned: wallet?.total_earned || 0,
                total_spent: wallet?.total_spent || 0,
                tier: internalProfile?.tier || 'free',
                status: internalProfile?.status || 'active'
            }
        }) || []

        // Apply additional filters (status, tier) in memory since they're from different tables
        let filteredUsers = users
        if (status) {
            filteredUsers = filteredUsers.filter(u => u.status === status)
        }
        if (tier) {
            filteredUsers = filteredUsers.filter(u => u.tier === tier)
        }

        return NextResponse.json({
            users: filteredUsers,
            total: count || 0,
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
