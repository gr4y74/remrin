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
                "relative flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50",
                isPopular ? "border-primary shadow-md bg-primary/5" : "border-border"
            )}
        >
            {isPopular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                        Best Value
                    </Badge>
                </div>
            )}

            {bonusAmount > 0 && (
                <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                        +{bonusAmount} Bonus
                    </Badge>
                </div>
            )}

            <CardHeader className="text-center pb-2">
                <div className="mx-auto bg-primary/10 p-3 rounded-full mb-2 w-fit">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">{amount + bonusAmount}</CardTitle>
                <CardDescription className="text-primary font-medium">Aether Credits</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 text-center">
                <div className="text-2xl font-bold mb-2">{price}</div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </CardContent>

            <CardFooter>
                <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={onBuy}
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : "Buy Now"}
                </Button>
            </CardFooter>
        </Card>
    )
}
