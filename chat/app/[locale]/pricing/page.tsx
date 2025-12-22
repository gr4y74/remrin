"use client"

import { useState } from "react"
import { PricingCard } from "@/components/pricing/PricingCard"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { getStripe } from "@/lib/stripe/client"
import { useToast } from "@/components/ui/use-toast"

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false)
    const [loadingTier, setLoadingTier] = useState<string | null>(null)
    const router = useRouter()
    const { toast } = useToast()

    const handleSubscribe = async (tierId: string, priceId: string | undefined) => {
        try {
            if (!priceId) {
                // Free tier logic or coming soon
                router.push("/login?signup=true")
                return
            }

            setLoadingTier(tierId)

            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId,
                    mode: "subscription",
                    successUrl: window.location.origin + "/settings?success=true",
                    cancelUrl: window.location.origin + "/pricing?canceled=true",
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
            console.error("Subscription error:", error)
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoadingTier(null)
        }
    }

    const tiers = [
        {
            id: "wanderer",
            title: "Wanderer",
            price: "Free",
            description: "For casual explorers of the Aether.",
            features: [
                { text: "100 Monthly Aether", included: true },
                { text: "Standard Generation Speed", included: true },
                { text: "Access to Public Souls", included: true },
                { text: "Create Custom Souls", included: false },
                { text: "Advanced Voice Mode", included: false },
            ],
            buttonText: "Get Started",
            priceId: undefined // Free
        },
        {
            id: "soul-weaver",
            title: "Soul Weaver",
            price: isAnnual ? "$99.99" : "$9.99",
            description: "For creators ready to weave new realities.",
            features: [
                { text: "1,000 Monthly Aether", included: true },
                { text: "Fast Generation Speed", included: true },
                { text: "Create 5 Custom Souls", included: true },
                { text: "Access to Public Souls", included: true },
                { text: "Advanced Voice Mode", included: false },
            ],
            buttonText: "Subscribe",
            priceId: isAnnual ? "price_soul_weaver_annual" : "price_soul_weaver_monthly"
        },
        {
            id: "architect",
            title: "Architect",
            price: isAnnual ? "$199.99" : "$19.99",
            description: "For master builders of worlds.",
            features: [
                { text: "2,500 Monthly Aether", included: true },
                { text: "Turbo Generation Speed", included: true },
                { text: "Create Unlimited Souls", included: true },
                { text: "Priority Support", included: true },
                { text: "Advanced Voice Mode", included: true },
            ],
            buttonText: "Subscribe",
            isPopular: true,
            priceId: isAnnual ? "price_architect_annual" : "price_architect_monthly"
        },
        {
            id: "titan",
            title: "Titan",
            price: isAnnual ? "$499.99" : "$49.99",
            description: "For legends who shape the cosmos.",
            features: [
                { text: "10,000 Monthly Aether", included: true },
                { text: "Instant Generation", included: true },
                { text: "Exclusive Early Access", included: true },
                { text: "Dedicated Success Manager", included: true },
                { text: "All Features Included", included: true },
            ],
            buttonText: "Subscribe",
            priceId: isAnnual ? "price_titan_annual" : "price_titan_monthly"
        }
    ]

    return (
        <div className="container mx-auto py-12 px-4 max-w-7xl">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                    Choose Your Destiny
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Unlock the full potential of Remrin. Create, explore, and connect with souls across the multiverse.
                </p>

                <div className="flex items-center justify-center gap-4 pt-4">
                    <Label htmlFor="billing-toggle" className={`text-sm ${!isAnnual ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        Monthly
                    </Label>
                    <Switch
                        id="billing-toggle"
                        checked={isAnnual}
                        onCheckedChange={setIsAnnual}
                    />
                    <Label htmlFor="billing-toggle" className={`text-sm ${isAnnual ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        Annual <span className="text-xs text-green-500 font-normal ml-1">(Save 20%)</span>
                    </Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {tiers.map((tier) => (
                    <PricingCard
                        key={tier.id}
                        {...tier}
                        interval={isAnnual ? "year" : "month"}
                        isLoading={loadingTier === tier.id}
                        onSubscribe={() => handleSubscribe(tier.id, tier.priceId)}
                    />
                ))}
            </div>
        </div>
    )
}
