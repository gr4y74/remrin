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

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user } } = await supabaseAdmin.auth.getUser(token)

        if (!user || !(await isAdmin(user.id))) {
            return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { email, password, username, display_name, tier, initial_aether } = body

        // Validate required fields
        if (!email || !password || !username) {
            return NextResponse.json(
                { error: 'Email, password, and username are required' },
                { status: 400 }
            )
        }

        // Create auth user
        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm email for admin-created users
        })

        if (authError || !newUser.user) {
            console.error('Auth user creation error:', authError)
            return NextResponse.json(
                { error: authError?.message || 'Failed to create user' },
                { status: 500 }
            )
        }

        const userId = newUser.user.id

        try {
            // Create user_profiles entry
            const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                    user_id: userId,
                    username,
                    display_name: display_name || username
                })

            if (profileError) {
                console.error('Profile creation error:', profileError)
                // Rollback: delete auth user
                await supabaseAdmin.auth.admin.deleteUser(userId)
                return NextResponse.json(
                    { error: 'Failed to create user profile: ' + profileError.message },
                    { status: 500 }
                )
            }

            // Create profiles (internal) entry
            const { error: internalProfileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    user_id: userId,
                    tier: tier || 'free',
                    status: 'active'
                })

            if (internalProfileError) {
                console.error('Internal profile creation error:', internalProfileError)
                // Rollback
                await supabaseAdmin.auth.admin.deleteUser(userId)
                return NextResponse.json(
                    { error: 'Failed to create internal profile' },
                    { status: 500 }
                )
            }

            // Create wallet with custom initial Aether if specified
            const aetherBalance = initial_aether !== undefined ? initial_aether : 100
            const { error: walletError } = await supabaseAdmin
                .from('wallets')
                .insert({
                    user_id: userId,
                    balance_aether: aetherBalance,
                    balance_brain: 1000 // Default brain credits
                })

            if (walletError) {
                console.error('Wallet creation error:', walletError)
                // Rollback
                await supabaseAdmin.auth.admin.deleteUser(userId)
                return NextResponse.json(
                    { error: 'Failed to create wallet' },
                    { status: 500 }
                )
            }

            return NextResponse.json({
                success: true,
                message: 'User created successfully',
                user: {
                    id: userId,
                    email,
                    username,
                    display_name: display_name || username,
                    tier: tier || 'free',
                    balance_aether: aetherBalance
                }
            }, { status: 201 })

        } catch (error: any) {
            // Rollback on any error
            await supabaseAdmin.auth.admin.deleteUser(userId)
            throw error
        }

    } catch (error: any) {
        console.error('Error in POST /api/admin/users/create:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
