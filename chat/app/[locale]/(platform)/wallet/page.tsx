import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { WalletDisplay, TransactionHistory } from "@/components/wallet"
import { PageTemplate } from "@/components/layout"
import { Metadata } from "next"
import {
    IconWallet,
    IconHistory,
    IconBox,
    IconFileDescription
} from "@tabler/icons-react"

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
        <div className="bg-rp-base min-h-screen w-full">
            <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
                {/* Header */}
                <div className="mb-10 flex flex-col gap-2">
                    <h1 className="font-tiempos-headline text-4xl font-bold text-rp-text md:text-5xl">
                        Wallet & Assets
                    </h1>
                    <p className="text-rp-subtle text-lg">
                        Manage your credits, view history, and access your collected digital items.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Left Column: Wallet Overview */}
                    <div className="lg:col-span-1 space-y-8">
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <IconWallet className="text-rp-iris" size={24} />
                                <h2 className="text-xl font-bold text-rp-text">Balance</h2>
                            </div>
                            <WalletDisplay
                                balanceAether={wallet?.balance_aether ?? 0}
                                balanceBrain={wallet?.balance_brain ?? 0}
                                variant="expanded"
                            />
                        </section>

                        {/* Inventory Section (Consolidated from Vault) */}
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <IconBox className="text-rp-iris" size={24} />
                                <h2 className="text-xl font-bold text-rp-text">Digital Assets</h2>
                            </div>
                            <div className="bg-rp-surface border-rp-muted/20 flex min-h-[200px] flex-col items-center justify-center rounded-2xl border p-6 text-center">
                                <IconBox className="text-rp-muted mb-3" size={48} />
                                <h3 className="text-rp-text font-semibold">No items found</h3>
                                <p className="text-rp-muted mt-1 text-sm">
                                    Your collected backgrounds, items, and hero images will appear here.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: History & Knowledge */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Transaction History */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IconHistory className="text-rp-iris" size={24} />
                                    <h2 className="text-xl font-bold text-rp-text">Transaction History</h2>
                                </div>
                            </div>
                            <div className="bg-rp-surface border-rp-muted/20 rounded-2xl border p-2">
                                <TransactionHistory
                                    transactions={transactions?.map(t => ({
                                        id: t.id,
                                        type: t.type as any,
                                        amount: t.amount,
                                        description: t.description,
                                        created_at: t.created_at
                                    })) || []}
                                />
                            </div>
                        </section>

                        {/* Knowledge Section (Moved from Vault) */}
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <IconFileDescription className="text-rp-iris" size={24} />
                                <h2 className="text-xl font-bold text-rp-text">AI Knowledge</h2>
                            </div>
                            <div className="bg-rp-surface border-rp-muted/20 rounded-2xl border overflow-hidden">
                                {knowledgeItems && knowledgeItems.length > 0 ? (
                                    <div className="divide-rp-muted/10 divide-y">
                                        {knowledgeItems.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-rp-overlay/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-rp-iris/10 text-rp-iris rounded p-2">
                                                        <IconFileDescription size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-rp-text text-sm font-medium">{item.file_name}</p>
                                                        <p className="text-rp-muted text-xs capitalize">{item.file_type} • {new Date(item.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <p className="text-rp-muted italic">No knowledge memories stored yet.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}
