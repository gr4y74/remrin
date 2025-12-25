"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CreditPackCardProps {
    amount: number
    price: string
    bonusAmount?: number
    description?: string
    isPopular?: boolean
    isLoading?: boolean
    onBuy: () => void
}

export function CreditPackCard({
    amount,
    price,
    bonusAmount = 0,
    description,
    isPopular = false,
    isLoading = false,
    onBuy
}: CreditPackCardProps) {
    return (
        <Card
            className={cn(
                "border-rp-muted/20 bg-rp-surface relative flex flex-col overflow-hidden transition-all duration-300",
                isPopular ? "border-rp-iris shadow-rp-iris/20 scale-105 shadow-2xl" : "hover:border-rp-muted/40 hover:bg-rp-overlay"
            )}
        >
            {isPopular && (
                <div className="bg-rp-iris text-rp-base absolute right-0 top-0 rounded-bl-lg px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    Most Popular
                </div>
            )}

            {bonusAmount > 0 && (
                <div className="absolute right-3 top-3">
                    <Badge variant="secondary" className="bg-rp-foam/10 text-rp-foam hover:bg-rp-foam/20 border-rp-foam/20">
                        +{bonusAmount} Bonus
                    </Badge>
                </div>
            )}

            <CardHeader className="pb-2 text-center">
                <div className="bg-rp-iris/10 mx-auto mb-2 w-fit rounded-full p-3">
                    <Sparkles className="text-rp-iris size-6" />
                </div>
                <CardTitle className="text-rp-text text-3xl font-bold">{amount + bonusAmount}</CardTitle>
                <CardDescription className="text-rp-subtle font-medium">Aether Credits</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 text-center">
                <div className="text-rp-text mb-2 text-2xl font-bold">{price}</div>
                {description && <p className="text-rp-subtle text-sm">{description}</p>}
            </CardContent>

            <CardFooter>
                <Button
                    onClick={onBuy}
                    className={cn(
                        "w-full font-bold uppercase tracking-wide transition-all duration-300",
                        isPopular
                            ? "from-rp-iris to-rp-rose text-rp-base bg-gradient-to-r hover:scale-105"
                            : "bg-rp-overlay text-rp-text hover:bg-rp-highlight-low"
                    )}
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : `Get ${amount.toLocaleString()} Aether`}
                </Button>
            </CardFooter>
        </Card>
    )
}
