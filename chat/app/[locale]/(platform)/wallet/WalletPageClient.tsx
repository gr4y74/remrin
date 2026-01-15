"use client"

import { useState } from "react"
import Link from "next/link"
import { WalletDisplay, TransactionHistory, TopUpModal } from "@/components/wallet"
import {
    IconWallet,
    IconHistory,
    IconBox,
    IconFileDescription,
    IconSparkles,
    IconPlus,
    IconCrown,
    IconRocket,
    IconDiamond,
    IconCheck
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface WalletPageClientProps {
    balanceAether: number
    balanceBrain: number
    transactions: any[]
    knowledgeItems: Array<{
        id: string
        file_name: string
        file_type: string
        created_at: string
    }>
}

// Subscription tiers
const SUBSCRIPTION_TIERS = [
    {
        id: "basic",
        name: "Basic",
        price: "$9.99",
        period: "/month",
        icon: IconRocket,
        color: "from-blue-500 to-cyan-500",
        features: [
            "500 Aether/month",
            "Basic model access",
            "5 Soul slots",
            "Standard support"
        ]
    },
    {
        id: "pro",
        name: "Pro",
        price: "$19.99",
        period: "/month",
        icon: IconCrown,
        color: "from-rp-iris to-rp-rose",
        popular: true,
        features: [
            "2,000 Aether/month",
            "All models access",
            "Unlimited Soul slots",
            "Priority support",
            "Custom API keys"
        ]
    },
    {
        id: "unlimited",
        name: "Unlimited",
        price: "$49.99",
        period: "/month",
        icon: IconDiamond,
        color: "from-amber-500 to-orange-500",
        features: [
            "Unlimited Aether",
            "All models + premium",
            "Unlimited everything",
            "Dedicated support",
            "Early access features",
            "Creator tools"
        ]
    }
]

export function WalletPageClient({
    balanceAether,
    balanceBrain,
    transactions,
    knowledgeItems
}: WalletPageClientProps) {
    const [isTopUpOpen, setIsTopUpOpen] = useState(false)

    return (
        <div className="bg-rp-base min-h-screen w-full">
            <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
                {/* Header */}
                <div className="mb-10 flex flex-col gap-2">
                    <h1 className="font-tiempos-headline text-4xl font-bold text-rp-text md:text-5xl">
                        Wallet & Assets
                    </h1>
                    <p className="text-rp-subtle text-lg">
                        Manage your credits, subscriptions, and digital items.
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
                                balanceAether={balanceAether}
                                balanceBrain={balanceBrain}
                                variant="expanded"
                                onAddFunds={() => setIsTopUpOpen(true)}
                            />
                        </section>

                        {/* Quick Top-Up Button */}
                        <button
                            onClick={() => setIsTopUpOpen(true)}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 text-white font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/30"
                        >
                            <IconPlus size={20} />
                            Buy Aether Credits
                        </button>

                        {/* Inventory Section */}
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <IconBox className="text-rp-iris" size={24} />
                                <h2 className="text-xl font-bold text-rp-text">Digital Assets</h2>
                            </div>
                            <div className="bg-rp-surface border-rp-muted/20 flex min-h-[150px] flex-col items-center justify-center rounded-2xl border p-6 text-center">
                                <IconBox className="text-rp-muted mb-3" size={40} />
                                <h3 className="text-rp-text font-semibold">No items found</h3>
                                <p className="text-rp-muted mt-1 text-sm">
                                    Backgrounds, items, and collectibles appear here.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Subscriptions, History & Knowledge */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Subscription Plans */}
                        <section>
                            <div className="mb-4 flex items-center gap-2">
                                <IconSparkles className="text-rp-iris" size={24} />
                                <h2 className="text-xl font-bold text-rp-text">Subscription Plans</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {SUBSCRIPTION_TIERS.map((tier) => {
                                    const Icon = tier.icon
                                    return (
                                        <div
                                            key={tier.id}
                                            className={cn(
                                                "relative bg-rp-surface border-rp-muted/20 rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-xl",
                                                tier.popular && "border-rp-iris ring-1 ring-rp-iris/50"
                                            )}
                                        >
                                            {tier.popular && (
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rp-iris to-rp-rose px-3 py-0.5 rounded-full text-xs font-semibold text-white">
                                                    Most Popular
                                                </div>
                                            )}
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br mb-4",
                                                tier.color
                                            )}>
                                                <Icon size={24} className="text-white" />
                                            </div>
                                            <h3 className="text-rp-text text-lg font-bold">{tier.name}</h3>
                                            <div className="flex items-baseline gap-1 mt-1 mb-4">
                                                <span className="text-rp-text text-2xl font-bold">{tier.price}</span>
                                                <span className="text-rp-muted text-sm">{tier.period}</span>
                                            </div>
                                            <ul className="space-y-2 mb-5">
                                                {tier.features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-2 text-sm text-rp-subtle">
                                                        <IconCheck size={16} className="text-emerald-400 shrink-0" />
                                                        {feature}
                                                    </li>
                                                ))}
                                            </ul>
                                            <Link
                                                href="/pricing"
                                                className={cn(
                                                    "block w-full text-center py-2.5 rounded-xl font-medium transition-all",
                                                    tier.popular
                                                        ? "bg-gradient-to-r from-rp-iris to-rp-rose text-white hover:shadow-lg hover:shadow-rp-iris/30"
                                                        : "bg-rp-overlay hover:bg-rp-highlight-low text-rp-text"
                                                )}
                                            >
                                                Subscribe
                                            </Link>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>

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

                        {/* Knowledge Section */}
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

            {/* Top-Up Modal */}
            <TopUpModal
                isOpen={isTopUpOpen}
                onClose={() => setIsTopUpOpen(false)}
                currentBalance={balanceAether}
            />
        </div>
    )
}
