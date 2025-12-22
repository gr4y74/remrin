"use client"

import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { IconCoin, IconLock, IconShield } from "@tabler/icons-react"
import { FC, useState } from "react"
import { CreditPackCard } from "@/components/pricing/CreditPackCard"
import { getStripe } from "@/lib/stripe/client"
import { useToast } from "@/components/ui/use-toast"

interface TopUpModalProps {
    isOpen: boolean
    onClose: () => void
    currentBalance?: number
}

interface Package {
    id: string
    aether: number
    price: string
    priceNum: number // for logic if needed
    bonus: number
    popular?: boolean
    priceId: string
}

const PACKAGES: Package[] = [
    { id: "starter", aether: 100, price: "$4.99", priceNum: 4.99, bonus: 0, priceId: "price_credit_starter" },
    { id: "pro", aether: 250, price: "$9.99", priceNum: 9.99, bonus: 25, popular: true, priceId: "price_credit_pro" },
    { id: "max", aether: 750, price: "$24.99", priceNum: 24.99, bonus: 100, priceId: "price_credit_max" }
]

export const TopUpModal: FC<TopUpModalProps> = ({
    isOpen,
    onClose,
    currentBalance = 0
}) => {
    const [processingPackage, setProcessingPackage] = useState<string | null>(null)
    const { toast } = useToast()

    const handlePurchase = async (pkg: Package) => {
        try {
            setProcessingPackage(pkg.id)

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId: pkg.priceId,
                    mode: "payment", // one-time payment
                    successUrl: window.location.origin + "/settings?success=true",
                    cancelUrl: window.location.origin + "/?canceled=true", // Go back home or stay on page
                }),
            })

            if (!response.ok) {
                throw new Error("Checkout failed")
            }

            const { sessionId } = await response.json()
            const stripe = await getStripe()

            if (!stripe) {
                throw new Error("Stripe failed to load")
            }

            await (stripe as any).redirectToCheckout({ sessionId })
        } catch (error) {
            console.error("Purchase error:", error)
            toast({
                title: "Error",
                description: "Could not initiate checkout. Please try again.",
                variant: "destructive",
            })
        } finally {
            setProcessingPackage(null)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-4xl bg-[#0d1117] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        <IconCoin className="text-amber-400" size={28} />
                        Add Aether Credits
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Power your AI souls with Aether credits. One-time purchase, never expires.
                    </DialogDescription>
                </DialogHeader>

                {/* Current Balance */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <span className="text-zinc-400">Current Balance</span>
                    <span className="text-lg font-bold text-amber-400">
                        {currentBalance.toLocaleString()} Aether
                    </span>
                </div>

                {/* Package Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PACKAGES.map((pkg) => (
                        <CreditPackCard
                            key={pkg.id}
                            amount={pkg.aether}
                            price={pkg.price}
                            bonusAmount={pkg.bonus}
                            isPopular={pkg.popular}
                            isLoading={processingPackage === pkg.id}
                            onBuy={() => handlePurchase(pkg)}
                        />
                    ))}
                </div>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-6 mt-6 text-zinc-500">
                    <div className="flex items-center gap-1.5 text-xs">
                        <IconLock size={14} />
                        <span>Secure Payment via Stripe</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
