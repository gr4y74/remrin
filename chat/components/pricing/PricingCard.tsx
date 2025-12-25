"use client"

import { Check } from "lucide-react"
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

interface PricingFeature {
    text: string
    included: boolean
}

interface PricingCardProps {
    title: string
    price: string
    description: string
    features: PricingFeature[]
    buttonText: string
    isPopular?: boolean
    isLoading?: boolean
    onSubscribe: () => void
    variant?: "default" | "outline"
    interval?: "month" | "year"
}

export function PricingCard({
    title,
    price,
    description,
    features,
    buttonText,
    isPopular = false,
    isLoading = false,
    onSubscribe,
    variant = "default",
    interval = "month"
}: PricingCardProps) {
    return (
        <Card
            className={cn(
                "relative flex flex-col h-full bg-rp-surface transition-all duration-300 hover:shadow-xl",
                isPopular ? "border-rp-iris shadow-rp-iris/10 scale-105 z-10" : "border-rp-muted/20"
            )}
        >
            {isPopular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge variant="default" className="bg-rp-iris text-rp-base hover:bg-rp-iris border-0">
                        Most Popular
                    </Badge>
                </div>
            )}

            <CardHeader>
                <CardTitle className="text-2xl font-bold text-rp-text">{title}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-rp-text">{price}</span>
                    {price !== "Free" && (
                        <span className="text-rp-subtle">/{interval}</span>
                    )}
                </div>
                <CardDescription className="mt-2 text-rp-subtle">{description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <Check
                                className={cn(
                                    "h-5 w-5 shrink-0",
                                    feature.included ? "text-rp-foam" : "text-rp-muted opacity-50"
                                )}
                            />
                            <span className={cn("text-sm text-rp-text", !feature.included && "text-rp-muted opacity-50")}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter>
                <Button
                    className={cn(
                        "w-full font-bold",
                        isPopular ? "bg-rp-iris text-rp-base hover:bg-rp-iris/90" : "border-rp-muted/30 text-rp-text hover:bg-rp-overlay"
                    )}
                    variant={isPopular ? "default" : "outline"}
                    onClick={onSubscribe}
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : buttonText}
                </Button>
            </CardFooter>
        </Card>
    )
}
