import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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

async function isAdmin(userId: string): Promise<boolean> {
    const { data } = await supabaseAdmin
        .from('profiles')
        .select('is_admin')
        .eq('user_id', userId)
        .single()

    return data?.is_admin === true
}

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { userId } = params

        // Fetch user data from all sources
        const [authUser, profile, wallet, internalProfile] = await Promise.all([
            supabaseAdmin.auth.admin.getUserById(userId),
            supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).single(),
            supabaseAdmin.from('wallets').select('*').eq('user_id', userId).single(),
            supabaseAdmin.from('profiles').select('*').eq('user_id', userId).single()
        ])

        if (!authUser.data.user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Count user's personas
        const { count: personaCount } = await supabaseAdmin
            .from('personas')
            .select('id', { count: 'exact', head: true })
            .eq('creator_id', userId)

        return NextResponse.json({
            id: userId,
            email: authUser.data.user.email,
            username: profile.data?.username || '',
            display_name: profile.data?.display_name || '',
            avatar_url: profile.data?.avatar_url || '',
            bio: profile.data?.bio || '',
            pronouns: profile.data?.pronouns || '',
            location: profile.data?.location || '',
            website_url: profile.data?.website_url || '',
            created_at: authUser.data.user.created_at,
            last_sign_in_at: authUser.data.user.last_sign_in_at,
            email_confirmed_at: authUser.data.user.email_confirmed_at,
            balance_aether: wallet.data?.balance_aether || 0,
            balance_brain: wallet.data?.balance_brain || 0,
            total_earned: wallet.data?.total_earned || 0,
            total_spent: wallet.data?.total_spent || 0,
            tier: internalProfile.data?.tier || 'free',
            status: internalProfile.data?.status || 'active',
            is_admin: internalProfile.data?.is_admin || false,
            persona_count: personaCount || 0
        })

    } catch (error: any) {
        console.error('Error in GET /api/admin/users/[userId]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { userId } = params
        const body = await request.json()

        const {
            username,
            display_name,
            bio,
            pronouns,
            location,
            website_url,
            status,
            tier,
            email
        } = body

        // Update user_profiles if profile fields changed
        if (username !== undefined || display_name !== undefined || bio !== undefined ||
            pronouns !== undefined || location !== undefined || website_url !== undefined) {
            const profileUpdates: any = {}
            if (username !== undefined) profileUpdates.username = username
            if (display_name !== undefined) profileUpdates.display_name = display_name
            if (bio !== undefined) profileUpdates.bio = bio
            if (pronouns !== undefined) profileUpdates.pronouns = pronouns
            if (location !== undefined) profileUpdates.location = location
            if (website_url !== undefined) profileUpdates.website_url = website_url

            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .update(profileUpdates)
                .eq('user_id', userId)

            if (profileError) {
                console.error('Profile update error:', profileError)
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
            }
        }

        // Update profiles (internal) if status or tier changed
        if (status !== undefined || tier !== undefined) {
            const internalUpdates: any = {}
            if (status !== undefined) internalUpdates.status = status
            if (tier !== undefined) internalUpdates.tier = tier

            const { error: internalError } = await supabaseAdmin
                .from('profiles')
                .update(internalUpdates)
                .eq('user_id', userId)

            if (internalError) {
                console.error('Internal profile update error:', internalError)
                return NextResponse.json({ error: 'Failed to update status/tier' }, { status: 500 })
            }
        }

        // Update email if changed
        if (email !== undefined) {
            const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                { email }
            )

            if (emailError) {
                console.error('Email update error:', emailError)
                return NextResponse.json({ error: 'Failed to update email' }, { status: 500 })
            }
        }

        return NextResponse.json({ success: true, message: 'User updated successfully' })

    } catch (error: any) {
        console.error('Error in PATCH /api/admin/users/[userId]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { userId } = params

        // Delete user from auth (cascade will handle related tables)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error('User deletion error:', deleteError)
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: 'User deleted successfully' })

    } catch (error: any) {
        console.error('Error in DELETE /api/admin/users/[userId]:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
