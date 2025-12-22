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
                "relative flex flex-col h-full transition-all duration-300 hover:shadow-lg",
                isPopular ? "border-primary shadow-md scale-105 z-10" : "border-border"
            )}
        >
            {isPopular && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                        Most Popular
                    </Badge>
                </div>
            )}

            <CardHeader>
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold">{price}</span>
                    {price !== "Free" && (
                        <span className="text-muted-foreground">/{interval}</span>
                    )}
                </div>
                <CardDescription className="mt-2">{description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                            <Check
                                className={cn(
                                    "h-5 w-5 shrink-0",
                                    feature.included ? "text-primary" : "text-muted-foreground opacity-50"
                                )}
                            />
                            <span className={cn("text-sm", !feature.included && "text-muted-foreground opacity-50")}>
                                {feature.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter>
                <Button
                    className="w-full"
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
