import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Metadata } from "next"
import { WalletPageClient } from "./WalletPageClient"

export const metadata: Metadata = {
    title: "My Wallet & Assets | Remrin",
    description: "Manage your Aether credits, view transaction history, and access your digital assets and knowledge vault items."
}

export default async function WalletPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-rp-subtle">Please login to view your wallet.</p>
            </div>
        )
    }

    // Fetch wallet balance
    const { data: wallet } = await supabase
        .from("wallets")
        .select("balance_aether, balance_brain")
        .eq("user_id", user.id)
        .single()

    // Fetch transactions (TODO: Implement transaction logging)
    const transactions: any[] = []

    // Fetch knowledge items (formerly in Vault)
    const { data: knowledgeItems } = await supabase
        .from("user_knowledge")
        .select("id, file_name, file_type, created_at")
        .eq("user_id", user.id)
        .limit(10)

    return (
        <WalletPageClient
            balanceAether={wallet?.balance_aether ?? 0}
            balanceBrain={wallet?.balance_brain ?? 0}
            transactions={transactions}
            knowledgeItems={knowledgeItems ?? []}
        />
    )
}
