import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

        const { data: wallet, error: walletError } = await supabase
            .from("wallets")
            .select("balance_aether, balance_brain, is_creator, total_earned, total_spent")
            .eq("user_id", user.id)
            .single()

        if (walletError) {
            // If wallet doesn't exist, create one
            if (walletError.code === "PGRST116") {
                const { data: newWallet, error: createError } = await supabase
                    .from("wallets")
                    .insert({ user_id: user.id })
                    .select("balance_aether, balance_brain, is_creator, total_earned, total_spent")
                    .single()

                if (createError) {
                    console.error("Error creating wallet:", createError)
                    return NextResponse.json(
                        { error: "Failed to create wallet" },
                        { status: 500 }
                    )
                }

                return NextResponse.json(newWallet)
            }

            console.error("Error fetching wallet:", walletError)
            return NextResponse.json(
                { error: "Failed to fetch wallet" },
                { status: 500 }
            )
        }

        return NextResponse.json(wallet)
    } catch (error) {
        console.error("Wallet API error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
