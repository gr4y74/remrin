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
            <DialogContent className="border-rp-muted/20 bg-rp-base text-rp-text overflow-hidden sm:max-w-md">
                {/* Success State */}
                {purchaseState === "success" && (
                    <div className="flex flex-col items-center py-8">
                        <div className="animate-fade-in-scale relative">
                            <div className="animate-pulse-glow absolute inset-0 rounded-full"
                                style={{ '--glow-color': 'rgba(156, 207, 216, 0.6)' } as React.CSSProperties}
                            />
                            <div className="bg-rp-foam relative rounded-full p-4">
                                <IconCheck className="text-rp-base size-12" />
                            </div>
                        </div>
                        <h3 className="text-rp-foam mt-6 text-2xl font-bold">
                            Purchase Complete!
                        </h3>
                        <p className="text-rp-subtle mt-2 text-center">
                            {listing.personas.name} has been added to your library.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {purchaseState === "error" && (
                    <div className="flex flex-col items-center py-8">
                        <div className="bg-rp-love/20 rounded-full p-4">
                            <IconAlertCircle className="text-rp-love size-12" />
                        </div>
                        <h3 className="text-rp-love mt-6 text-xl font-bold">
                            Purchase Failed
                        </h3>
                        <p className="text-rp-subtle mt-2 text-center">
                            {errorMessage}
                        </p>
                        <Button
                            onClick={() => setPurchaseState("idle")}
                            variant="outline"
                            className="border-rp-muted/20 text-rp-text hover:bg-rp-surface mt-4"
                        >
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Normal/Confirming State */}
                {(purchaseState === "idle" || purchaseState === "confirming") && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-rp-text text-xl">
                                Confirm Purchase
                            </DialogTitle>
                            <DialogDescription className="text-rp-subtle">
                                You are about to purchase this soul.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Soul Preview */}
                        <div className="bg-rp-surface my-4 flex items-center gap-4 rounded-xl p-4">
                            <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
                                {listing.personas.image_path ? (
                                    <Image
                                        src={listing.personas.image_path}
                                        alt={listing.personas.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="from-rp-gold/50 to-rp-rose/50 flex size-full items-center justify-center bg-gradient-to-br">
                                        <span className="text-rp-text/50 text-lg font-bold">
                                            {listing.personas.name.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-rp-text font-bold">
                                    {listing.personas.name}
                                </h4>
                                <p className="text-rp-subtle mt-1 line-clamp-2 text-sm">
                                    {listing.personas.description || "A unique AI companion"}
                                </p>
                                {listing.is_limited_edition && (
                                    <div className="bg-rp-love/20 text-rp-love mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
                                        <IconSparkles className="size-3" />
                                        Limited Edition
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Price Breakdown */}
                        <div className="bg-rp-surface space-y-2 rounded-xl p-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-rp-subtle">Price</span>
                                <div className="flex items-center gap-1">
                                    <IconDiamond className="text-rp-gold size-4" />
                                    <span className="text-rp-text font-semibold">
                                        {listing.price_aether.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-rp-muted flex items-center justify-between text-xs">
                                <span>Platform fee (30%)</span>
                                <span>{platformFee.toLocaleString()}</span>
                            </div>
                            <div className="text-rp-muted flex items-center justify-between text-xs">
                                <span>Seller receives</span>
                                <span>{sellerReceives.toLocaleString()}</span>
                            </div>
                            <div className="border-rp-muted/20 my-2 border-t" />
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
                                <div className="bg-rp-love/20 text-rp-love mt-2 flex items-center gap-2 rounded-lg p-2 text-xs">
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
                                className="border-rp-muted/20 text-rp-text hover:bg-rp-surface flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handlePurchase}
                                disabled={!canAfford || purchaseState === "confirming"}
                                className={cn(
                                    "from-rp-gold to-rp-rose text-rp-base flex-1 bg-gradient-to-r font-semibold",
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
