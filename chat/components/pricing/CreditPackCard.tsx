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
                "relative flex flex-col overflow-hidden border-rp-muted/20 bg-rp-surface transition-all duration-300",
                isPopular ? "scale-105 border-rp-iris shadow-2xl shadow-rp-iris/20" : "hover:border-rp-muted/40 hover:bg-rp-overlay"
            )}
        >
            {isPopular && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-rp-iris px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rp-base">
                    Most Popular
                </div>
            )}

            {bonusAmount > 0 && (
                <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-rp-foam/10 text-rp-foam hover:bg-rp-foam/20 border-rp-foam/20">
                        +{bonusAmount} Bonus
                    </Badge>
                </div>
            )}

            <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-rp-iris/10 p-3 rounded-full mb-2 w-fit">
                    <Sparkles className="h-6 w-6 text-rp-iris" />
                </div>
                <CardTitle className="text-3xl font-bold text-rp-text">{amount + bonusAmount}</CardTitle>
                <CardDescription className="text-rp-subtle font-medium">Aether Credits</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 text-center">
                <div className="text-2xl font-bold mb-2 text-rp-text">{price}</div>
                {description && <p className="text-sm text-rp-subtle">{description}</p>}
            </CardContent>

            <CardFooter>
                <Button
                    onClick={onBuy}
                    className={cn(
                        "w-full font-bold uppercase tracking-wide transition-all duration-300",
                        isPopular
                            ? "bg-gradient-to-r from-rp-iris to-rp-rose text-rp-base hover:scale-105"
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
