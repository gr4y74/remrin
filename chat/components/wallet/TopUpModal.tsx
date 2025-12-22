"use client"

import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconCheck, IconCoin, IconLock, IconShield } from "@tabler/icons-react"
import { FC, useState } from "react"

interface TopUpModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (amount: number) => void
    currentBalance?: number
}

interface Package {
    id: string
    aether: number
    price: number
    pricePerAether: number
    popular?: boolean
    bestValue?: boolean
}

const PACKAGES: Package[] = [
    { id: "starter", aether: 100, price: 10, pricePerAether: 0.10 },
    { id: "popular", aether: 500, price: 40, pricePerAether: 0.08, popular: true },
    { id: "best-value", aether: 1000, price: 75, pricePerAether: 0.075, bestValue: true }
]

export const TopUpModal: FC<TopUpModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    currentBalance = 0
}) => {
    const [selectedPackage, setSelectedPackage] = useState<string | null>("popular")
    const [isProcessing, setIsProcessing] = useState(false)

    const handlePurchase = async () => {
        if (!selectedPackage) return

        const pkg = PACKAGES.find(p => p.id === selectedPackage)
        if (!pkg) return

        setIsProcessing(true)

        // TODO: Integrate Stripe checkout
        // For now, simulate a delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        setIsProcessing(false)
        onSuccess?.(pkg.aether)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-[#0d1117] border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                        <IconCoin className="text-amber-400" size={28} />
                        Add Aether Credits
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Power your AI souls with Aether credits
                    </DialogDescription>
                </DialogHeader>

                {/* Current Balance */}
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-zinc-400">Current Balance</span>
                    <span className="text-lg font-bold text-amber-400">
                        {currentBalance.toLocaleString()} Aether
                    </span>
                </div>

                {/* Package Selection */}
                <div className="grid gap-3 mt-2">
                    {PACKAGES.map((pkg) => (
                        <button
                            key={pkg.id}
                            onClick={() => setSelectedPackage(pkg.id)}
                            className={cn(
                                "relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                                "hover:scale-[1.02] hover:shadow-lg",
                                selectedPackage === pkg.id
                                    ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/50 shadow-amber-500/10"
                                    : "bg-white/5 border-white/10 hover:border-white/20"
                            )}
                        >
                            {/* Popular/Best Value Badge */}
                            {(pkg.popular || pkg.bestValue) && (
                                <div className={cn(
                                    "absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                    pkg.bestValue
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                        : "bg-gradient-to-r from-amber-500 to-yellow-500 text-black"
                                )}>
                                    {pkg.bestValue ? "Best Value" : "Popular"}
                                </div>
                            )}

                            {/* Left: Amount */}
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "size-12 flex items-center justify-center rounded-full",
                                    selectedPackage === pkg.id
                                        ? "bg-amber-500/20"
                                        : "bg-white/5"
                                )}>
                                    <IconCoin size={24} className="text-amber-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xl font-bold text-white">
                                        {pkg.aether.toLocaleString()} Aether
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                        ${pkg.pricePerAether.toFixed(2)} per credit
                                    </p>
                                </div>
                            </div>

                            {/* Right: Price + Selection */}
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-white">
                                    ${pkg.price}
                                </span>
                                <div className={cn(
                                    "size-6 flex items-center justify-center rounded-full border-2 transition-all",
                                    selectedPackage === pkg.id
                                        ? "bg-amber-500 border-amber-500"
                                        : "border-zinc-600"
                                )}>
                                    {selectedPackage === pkg.id && (
                                        <IconCheck size={14} className="text-black" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Checkout Button */}
                <Button
                    onClick={handlePurchase}
                    disabled={!selectedPackage || isProcessing}
                    className={cn(
                        "w-full h-12 text-lg font-semibold mt-2",
                        "bg-gradient-to-r from-amber-500 to-yellow-500",
                        "hover:from-amber-400 hover:to-yellow-400",
                        "text-black",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isProcessing ? (
                        <span className="flex items-center gap-2">
                            <div className="size-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        "Purchase with Stripe"
                    )}
                </Button>

                {/* Security Badges */}
                <div className="flex items-center justify-center gap-6 mt-2 text-zinc-500">
                    <div className="flex items-center gap-1.5 text-xs">
                        <IconLock size={14} />
                        <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <IconShield size={14} />
                        <span>SSL Encrypted</span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
