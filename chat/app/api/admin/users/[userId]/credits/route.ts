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

export async function POST(
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
        const { type, amount, reason } = body

        // Validate input
        if (!type || !['aether', 'brain'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid credit type. Must be "aether" or "brain"' },
                { status: 400 }
            )
        }

        if (amount === undefined || typeof amount !== 'number') {
            return NextResponse.json(
                { error: 'Amount must be a number' },
                { status: 400 }
            )
        }

        if (!reason) {
            return NextResponse.json(
                { error: 'Reason is required for audit trail' },
                { status: 400 }
            )
        }

        // Get current wallet
        const { data: wallet, error: walletError } = await supabaseAdmin
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (walletError || !wallet) {
            return NextResponse.json(
                { error: 'Wallet not found for user' },
                { status: 404 }
            )
        }

        // Calculate new balance
        const field = type === 'aether' ? 'balance_aether' : 'balance_brain'
        const currentBalance = wallet[field]
        const newBalance = currentBalance + amount

        // Prevent negative balance
        if (newBalance < 0) {
            return NextResponse.json(
                { error: `Insufficient balance. Current: ${currentBalance}, Requested change: ${amount}` },
                { status: 400 }
            )
        }

        // Update wallet
        const updates: any = { [field]: newBalance }

        // Update total_earned or total_spent
        if (amount > 0) {
            updates.total_earned = wallet.total_earned + amount
        } else if (amount < 0) {
            updates.total_spent = wallet.total_spent + Math.abs(amount)
        }

        const { error: updateError } = await supabaseAdmin
            .from('wallets')
            .update(updates)
            .eq('user_id', userId)

        if (updateError) {
            console.error('Wallet update error:', updateError)
            return NextResponse.json(
                { error: 'Failed to update wallet' },
                { status: 500 }
            )
        }

        // TODO: Log this action in an audit table
        console.log(`[ADMIN CREDIT ADJUSTMENT] Admin ${user.id} adjusted ${type} for user ${userId} by ${amount}. Reason: ${reason}`)

        return NextResponse.json({
            success: true,
            message: 'Credits updated successfully',
            previous_balance: currentBalance,
            new_balance: newBalance,
            change: amount,
            type,
            reason
        })

    } catch (error: any) {
        console.error('Error in POST /api/admin/users/[userId]/credits:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
