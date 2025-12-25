"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MarketListingWithPersona } from "@/lib/marketplace"
import {
    IconDiamond,
    IconSparkles,
    IconCheck,
    IconX,
    IconLoader2,
    IconAlertCircle
} from "@tabler/icons-react"

interface PurchaseModalProps {
    isOpen: boolean
    onClose: () => void
    listing: MarketListingWithPersona | null
    userBalance: number
    onSuccess?: () => void
}

type PurchaseState = "idle" | "confirming" | "success" | "error"

export function PurchaseModal({
    isOpen,
    onClose,
    listing,
    userBalance,
    onSuccess
}: PurchaseModalProps) {
    const [purchaseState, setPurchaseState] = useState<PurchaseState>("idle")
    const [errorMessage, setErrorMessage] = useState("")

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPurchaseState("idle")
            setErrorMessage("")
        }
    }, [isOpen])

    if (!listing) return null

    const canAfford = userBalance >= listing.price_aether
    const platformFee = Math.floor(listing.price_aether * 0.3)
    const sellerReceives = listing.price_aether - platformFee

    const handlePurchase = async () => {
        if (!canAfford) return

        setPurchaseState("confirming")

        try {
            const response = await fetch("/api/marketplace/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ listing_id: listing.id })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Purchase failed")
            }

            setPurchaseState("success")

            // Auto-close after success animation
            setTimeout(() => {
                onSuccess?.()
            }, 2000)
        } catch (error) {
            setPurchaseState("error")
            setErrorMessage(error instanceof Error ? error.message : "Purchase failed")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="overflow-hidden border-rp-muted/20 bg-rp-base text-rp-text sm:max-w-md">
                {/* Success State */}
                {purchaseState === "success" && (
                    <div className="flex flex-col items-center py-8">
                        <div className="animate-fade-in-scale relative">
                            <div className="absolute inset-0 animate-pulse-glow rounded-full"
                                style={{ '--glow-color': 'rgba(156, 207, 216, 0.6)' } as React.CSSProperties}
                            />
                            <div className="relative rounded-full bg-rp-foam p-4">
                                <IconCheck className="size-12 text-rp-base" />
                            </div>
                        </div>
                        <h3 className="mt-6 text-2xl font-bold text-rp-foam">
                            Purchase Complete!
                        </h3>
                        <p className="mt-2 text-center text-rp-subtle">
                            {listing.personas.name} has been added to your library.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {purchaseState === "error" && (
                    <div className="flex flex-col items-center py-8">
                        <div className="rounded-full bg-rp-love/20 p-4">
                            <IconAlertCircle className="size-12 text-rp-love" />
                        </div>
                        <h3 className="mt-6 text-xl font-bold text-rp-love">
                            Purchase Failed
                        </h3>
                        <p className="mt-2 text-center text-rp-subtle">
                            {errorMessage}
                        </p>
                        <Button
                            onClick={() => setPurchaseState("idle")}
                            variant="outline"
                            className="mt-4 border-rp-muted/20 text-rp-text hover:bg-rp-surface"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Normal/Confirming State */}
                {(purchaseState === "idle" || purchaseState === "confirming") && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl text-rp-text">
                                Confirm Purchase
                            </DialogTitle>
                            <DialogDescription className="text-rp-subtle">
                                You are about to purchase this soul.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Soul Preview */}
                        <div className="my-4 flex items-center gap-4 rounded-xl bg-rp-surface p-4">
                            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                                {listing.personas.image_path ? (
                                    <Image
                                        src={listing.personas.image_path}
                                        alt={listing.personas.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-rp-gold/50 to-rp-rose/50">
                                        <span className="text-lg font-bold text-rp-text/50">
                                            {listing.personas.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-rp-text">
                                    {listing.personas.name}
                                </h4>
                                <p className="mt-1 line-clamp-2 text-sm text-rp-subtle">
                                    {listing.personas.description || "A unique AI companion"}
                                </p>
                                {listing.is_limited_edition && (
                                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-rp-love/20 px-2 py-0.5 text-xs text-rp-love">
                                        <IconSparkles className="size-3" />
                                        Limited Edition
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="space-y-2 rounded-xl bg-rp-surface p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-rp-subtle">Price</span>
                                <div className="flex items-center gap-1">
                                    <IconDiamond className="size-4 text-rp-gold" />
                                    <span className="font-semibold text-rp-text">
                                        {listing.price_aether.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-rp-muted">
                                <span>Platform fee (30%)</span>
                                <span>{platformFee.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-rp-muted">
                                <span>Seller receives</span>
                                <span>{sellerReceives.toLocaleString()}</span>
                            </div>
                            <div className="my-2 border-t border-rp-muted/20" />
                            <div className="flex items-center justify-between">
                                <span className="text-rp-subtle">Your Balance</span>
                                <div className={cn(
                                    "flex items-center gap-1 font-semibold",
                                    canAfford ? "text-rp-foam" : "text-rp-love"
                                )}>
                                    <IconDiamond className="size-4" />
                                    <span>{userBalance.toLocaleString()}</span>
                                </div>
                            </div>
                            {!canAfford && (
                                <div className="mt-2 flex items-center gap-2 rounded-lg bg-rp-love/20 p-2 text-xs text-rp-love">
                                    <IconX className="size-4" />
                                    <span>Insufficient balance. You need {(listing.price_aether - userBalance).toLocaleString()} more Aether.</span>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-4 flex gap-2 sm:gap-2">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                disabled={purchaseState === "confirming"}
                                className="flex-1 border-rp-muted/20 text-rp-text hover:bg-rp-surface"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePurchase}
                                disabled={!canAfford || purchaseState === "confirming"}
                                className={cn(
                                    "flex-1 bg-gradient-to-r from-rp-gold to-rp-rose font-semibold text-rp-base",
                                    "hover:from-rp-gold/80 hover:to-rp-rose/80",
                                    "disabled:opacity-50"
                                )}
                            >
                                {purchaseState === "confirming" ? (
                                    <>
                                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Confirm Purchase"
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
