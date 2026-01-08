"use client"

import * as React from "react"
import { Check, Lock, Sparkles, Zap, Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type ProviderId = "edge-tts" | "kokoro" | "elevenlabs"

interface ProviderSelectorProps {
    selectedProvider: ProviderId
    onSelect: (provider: ProviderId) => void
    userTier?: "free" | "pro" | "enterprise"
}

interface ProviderOption {
    id: ProviderId
    name: string
    description: string
    icon: React.ReactNode
    quality: "Basic" | "High" | "Ultra"
    cost: "Free" | "Low" | "High"
    isPremium: boolean
}

const PROVIDERS: ProviderOption[] = [
    {
        id: "edge-tts",
        name: "Edge TTS",
        description: "Standard quality voices, good for prototyping.",
        icon: <Globe className="h-5 w-5 text-blue-400" />,
        quality: "Basic",
        cost: "Free",
        isPremium: false,
    },
    {
        id: "kokoro",
        name: "Kokoro",
        description: "High quality open-weights model. Balanced performance.",
        icon: <Zap className="h-5 w-5 text-yellow-400" />,
        quality: "High",
        cost: "Low",
        isPremium: false,
    },
    {
        id: "elevenlabs",
        name: "ElevenLabs",
        description: "Industry standard for realism and emotion.",
        icon: <Sparkles className="h-5 w-5 text-purple-400" />,
        quality: "Ultra",
        cost: "High",
        isPremium: true,
    },
]

export function ProviderSelector({
    selectedProvider,
    onSelect,
    userTier = "free",
}: ProviderSelectorProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-3">
            {PROVIDERS.map((provider) => {
                const isLocked = provider.isPremium && userTier === "free"
                const isSelected = selectedProvider === provider.id

                return (
                    <div key={provider.id} className="relative group">
                        <Card
                            className={cn(
                                "cursor-pointer transition-all hover:border-primary/50 h-full",
                                isSelected && "border-primary ring-1 ring-primary bg-primary/5",
                                isLocked && "opacity-60 cursor-not-allowed hover:border-border"
                            )}
                            onClick={() => !isLocked && onSelect(provider.id)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-md bg-muted">
                                            {provider.icon}
                                        </div>
                                        {isSelected && (
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </div>
                                    {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                <CardTitle className="mt-4 text-lg">{provider.name}</CardTitle>
                                <CardDescription className="text-xs">
                                    {provider.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                        {provider.quality} Quality
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] h-5">
                                        {provider.cost} Cost
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            })}
        </div>
    )
}
