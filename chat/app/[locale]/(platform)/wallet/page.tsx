"use client"

import { RemrinContext } from "@/context/context"
import { createClient } from "@/lib/supabase/client"
import { IconCoins, IconCreditCard, IconWallet } from "@tabler/icons-react"
import { useContext, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function WalletPage() {
    const { profile } = useContext(RemrinContext)
    const [balance, setBalance] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchWallet() {
            if (!profile) return

            const supabase = createClient()
            const { data: wallet } = await supabase
                .from("wallets")
                .select("balance_aether")
                .eq("user_id", profile.user_id)
                .single()

            if (wallet) {
                setBalance(wallet.balance_aether || 0)
            }
            setLoading(false)
        }

        fetchWallet()
    }, [profile])

    const handleTopUp = () => {
        // TODO: Integrate Stripe checkout
        console.log("Top up clicked - Stripe integration needed")
    }

    if (loading) {
        return (
            <div className="bg-rp-base flex min-h-screen items-center justify-center">
                <div className="text-rp-text">Loading wallet...</div>
            </div>
        )
    }

    return (
        <div className="bg-rp-base flex min-h-screen flex-col">
            <div className="mx-auto w-full max-w-4xl p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-tiempos-headline text-rp-text mb-2 text-3xl font-bold">
                        Wallet & Aether
                    </h1>
                    <p className="text-rp-muted">
                        Manage your Aether balance and purchase credits
                    </p>
                </div>

                {/* Balance Card */}
                <div className="bg-rp-surface border-rp-highlight-med mb-6 rounded-2xl border p-8">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="bg-rp-overlay flex size-12 items-center justify-center rounded-full">
                            <IconWallet size={24} className="text-rp-gold" />
                        </div>
                        <div>
                            <p className="text-rp-muted text-sm">Current Balance</p>
                            <p className="font-tiempos-headline text-rp-text text-4xl font-bold">
                                {balance.toLocaleString()} <span className="text-rp-gold text-2xl">Aether</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Up Section */}
                <div className="bg-rp-surface border-rp-highlight-med rounded-2xl border p-6">
                    <h2 className="font-tiempos-headline text-rp-text mb-4 text-xl font-bold">
                        Purchase Aether
                    </h2>

                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Credit Pack 1 */}
                        <div className="bg-rp-overlay hover:border-rp-iris group cursor-pointer rounded-xl border border-transparent p-4 transition-all">
                            <div className="mb-2 flex items-center gap-2">
                                <IconCoins size={20} className="text-rp-foam" />
                                <span className="text-rp-text font-semibold">1,000 Aether</span>
                            </div>
                            <p className="text-rp-text mb-3 text-2xl font-bold">$9.99</p>
                            <Button
                                onClick={handleTopUp}
                                className="bg-rp-iris hover:bg-rp-iris/80 w-full"
                            >
                                Purchase
                            </Button>
                        </div>

                        {/* Credit Pack 2 */}
                        <div className="bg-rp-overlay hover:border-rp-rose group cursor-pointer rounded-xl border border-transparent p-4 transition-all">
                            <div className="mb-2 flex items-center gap-2">
                                <IconCoins size={20} className="text-rp-gold" />
                                <span className="text-rp-text font-semibold">5,000 Aether</span>
                            </div>
                            <p className="text-rp-text mb-1 text-2xl font-bold">$39.99</p>
                            <p className="text-rp-foam mb-2 text-xs">Save 20%</p>
                            <Button
                                onClick={handleTopUp}
                                className="bg-rp-rose hover:bg-rp-rose/80 w-full"
                            >
                                Purchase
                            </Button>
                        </div>

                        {/* Credit Pack 3 */}
                        <div className="bg-rp-overlay hover:border-rp-gold group cursor-pointer rounded-xl border border-transparent p-4 transition-all">
                            <div className="mb-2 flex items-center gap-2">
                                <IconCoins size={20} className="text-rp-rose" />
                                <span className="text-rp-text font-semibold">10,000 Aether</span>
                            </div>
                            <p className="text-rp-text mb-1 text-2xl font-bold">$69.99</p>
                            <p className="text-rp-gold mb-2 text-xs">Save 30%</p>
                            <Button
                                onClick={handleTopUp}
                                className="bg-rp-gold hover:bg-rp-gold/80 w-full text-black"
                            >
                                Purchase
                            </Button>
                        </div>
                    </div>

                    <div className="border-rp-highlight-med mt-6 flex items-center gap-2 border-t pt-4">
                        <IconCreditCard size={16} className="text-rp-muted" />
                        <p className="text-rp-muted text-sm">
                            Secure payment powered by Stripe
                        </p>
                    </div>
                </div>

                {/* Transaction History (Placeholder) */}
                <div className="bg-rp-surface border-rp-highlight-med mt-6 rounded-2xl border p-6">
                    <h2 className="font-tiempos-headline text-rp-text mb-4 text-xl font-bold">
                        Recent Transactions
                    </h2>
                    <p className="text-rp-muted text-center py-8">
                        No transactions yet
                    </p>
                </div>
            </div>
        </div>
    )
}
