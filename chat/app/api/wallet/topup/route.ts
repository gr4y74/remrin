import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

interface TopupRequest {
    amount: number
    transaction_id: string
    type?: "aether" | "brain"
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        const {
            data: { user },
            error: authError
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body: TopupRequest = await request.json()
        const { amount, transaction_id, type = "aether" } = body

        // Validate request
        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: "Invalid amount" },
                { status: 400 }
            )
        }

        if (!transaction_id) {
            return NextResponse.json(
                { error: "Transaction ID required" },
                { status: 400 }
            )
        }

        // Get current wallet
        const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", user.id)
            .single()

        if (walletError) {
            console.error("Error fetching wallet:", walletError)
            return NextResponse.json(
                { error: "Wallet not found" },
                { status: 404 }
            )
        }

        // Update balance based on type
        const updateData =
            type === "brain"
                ? {
                    balance_brain: wallet.balance_brain + amount,
                    total_earned: wallet.total_earned + amount
                }
                : {
                    balance_aether: wallet.balance_aether + amount,
                    total_earned: wallet.total_earned + amount
                }

        const { data: updatedWallet, error: updateError } = await supabase
            .from("wallets")
            .update(updateData)
            .eq("user_id", user.id)
            .select("balance_aether, balance_brain, is_creator, total_earned, total_spent")
            .single()

        if (updateError) {
            console.error("Error updating wallet:", updateError)
            return NextResponse.json(
                { error: "Failed to update wallet" },
                { status: 500 }
            )
        }

        // TODO: Log transaction for audit trail
        // await supabase.from("transactions").insert({
        //   user_id: user.id,
        //   transaction_id,
        //   amount,
        //   type: "topup",
        //   created_at: new Date().toISOString()
        // })

        return NextResponse.json({
            success: true,
            wallet: updatedWallet,
            transaction_id
        })
    } catch (error) {
        console.error("Topup API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
