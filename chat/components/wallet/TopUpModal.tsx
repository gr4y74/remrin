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
            <DialogContent className="bg-rp-base border-rp-muted/20 sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="text-rp-text flex items-center gap-2 text-2xl font-bold">
                        <IconCoin className="text-rp-gold" size={28} />
                        Add Aether Credits
                    </DialogTitle>
                    <DialogDescription className="text-rp-muted">
                        Power your AI souls with Aether credits. One-time purchase, never expires.
                    </DialogDescription>
                </DialogHeader>

                {/* Current Balance */}
                <div className="bg-rp-surface border-rp-muted/20 mb-4 flex items-center justify-between rounded-xl border px-4 py-3">
                    <span className="text-rp-subtle">Current Balance</span>
                    <span className="text-rp-gold text-lg font-bold">
                        {currentBalance.toLocaleString()} Aether
                    </span>
                </div>

                {/* Package Selection */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <div className="text-rp-muted mt-6 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 text-xs">
                        <IconLock size={14} />
                        <span>Secure Payment via Stripe</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
