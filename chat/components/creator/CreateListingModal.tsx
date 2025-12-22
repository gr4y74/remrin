"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { createListing } from "@/lib/marketplace"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Loader2, Sparkles, Crown } from "lucide-react"

interface Persona {
    id: string
    name: string
    description: string | null
    image_path: string | null
}

interface CreateListingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userId: string
    onSuccess: () => void
}

export function CreateListingModal({
    open,
    onOpenChange,
    userId,
    onSuccess
}: CreateListingModalProps) {
    const [personas, setPersonas] = useState<Persona[]>([])
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>("")
    const [price, setPrice] = useState("")
    const [isLimited, setIsLimited] = useState(false)
    const [quantity, setQuantity] = useState("")
    const [loading, setLoading] = useState(false)
    const [loadingPersonas, setLoadingPersonas] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const supabase = createClient()

    // Fetch user's personas that aren't already listed
    useEffect(() => {
        if (!open) return

        const fetchPersonas = async () => {
            setLoadingPersonas(true)
            try {
                // Get personas owned by user
                const { data: ownedPersonas } = await supabase
                    .from("personas")
                    .select("id, name, description, image_path")
                    .eq("user_id", userId)
                    .order("name")

                // Get already listed persona IDs
                const { data: listedPersonas } = await supabase
                    .from("market_listings")
                    .select("persona_id")
                    .eq("seller_id", userId)

                const listedIds = new Set(listedPersonas?.map((l) => l.persona_id) || [])

                // Filter out already listed
                const available = (ownedPersonas || []).filter(
                    (p) => !listedIds.has(p.id)
                )

                setPersonas(available)
            } catch (err) {
                console.error("Error fetching personas:", err)
            } finally {
                setLoadingPersonas(false)
            }
        }

        fetchPersonas()
    }, [open, userId, supabase])

    const selectedPersona = personas.find((p) => p.id === selectedPersonaId)

    const handleSubmit = async () => {
        if (!selectedPersonaId || !price) {
            setError("Please select a persona and set a price")
            return
        }

        const priceNum = parseInt(price, 10)
        if (isNaN(priceNum) || priceNum <= 0) {
            setError("Price must be a positive number")
            return
        }

        if (isLimited) {
            const qtyNum = parseInt(quantity, 10)
            if (isNaN(qtyNum) || qtyNum <= 0) {
                setError("Quantity must be a positive number")
                return
            }
        }

        setLoading(true)
        setError(null)

        try {
            const { error: createError } = await createListing(supabase, userId, {
                persona_id: selectedPersonaId,
                price_aether: priceNum,
                is_limited_edition: isLimited,
                quantity: isLimited ? parseInt(quantity, 10) : undefined
            })

            if (createError) {
                setError(createError)
                return
            }

            // Reset form
            setSelectedPersonaId("")
            setPrice("")
            setIsLimited(false)
            setQuantity("")

            onOpenChange(false)
            onSuccess()
        } catch (err) {
            console.error("Error creating listing:", err)
            setError("Failed to create listing")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md border-white/10 bg-zinc-900">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Sparkles className="size-5 text-purple-400" />
                        Create Listing
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        List one of your souls in the marketplace.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Persona Select */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Select Soul</Label>
                        <Select
                            value={selectedPersonaId}
                            onValueChange={setSelectedPersonaId}
                            disabled={loadingPersonas}
                        >
                            <SelectTrigger className="border-white/10 bg-white/5 text-white">
                                <SelectValue placeholder="Choose a soul to list..." />
                            </SelectTrigger>
                            <SelectContent className="border-white/10 bg-zinc-900">
                                {personas.map((persona) => (
                                    <SelectItem
                                        key={persona.id}
                                        value={persona.id}
                                        className="text-white focus:bg-white/10"
                                    >
                                        {persona.name}
                                    </SelectItem>
                                ))}
                                {personas.length === 0 && !loadingPersonas && (
                                    <div className="p-2 text-center text-sm text-zinc-500">
                                        No unlisted souls available
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Preview Card */}
                    {selectedPersona && (
                        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                            <div className="relative size-12 overflow-hidden rounded-lg bg-zinc-800">
                                {selectedPersona.image_path ? (
                                    <Image
                                        src={selectedPersona.image_path}
                                        alt={selectedPersona.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex size-full items-center justify-center text-lg font-bold text-zinc-600">
                                        {selectedPersona.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">
                                    {selectedPersona.name}
                                </p>
                                <p className="text-xs text-zinc-400 truncate">
                                    {selectedPersona.description || "No description"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Price */}
                    <div className="space-y-2">
                        <Label className="text-zinc-300">Price (Aether)</Label>
                        <Input
                            type="number"
                            placeholder="100"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
                        />
                    </div>

                    {/* Limited Edition Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-2">
                            <Crown className="size-4 text-amber-400" />
                            <div>
                                <p className="text-sm font-medium text-white">
                                    Limited Edition
                                </p>
                                <p className="text-xs text-zinc-400">
                                    Set a maximum quantity
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={isLimited}
                            onCheckedChange={setIsLimited}
                        />
                    </div>

                    {/* Quantity (if limited) */}
                    {isLimited && (
                        <div className="space-y-2">
                            <Label className="text-zinc-300">Quantity</Label>
                            <Input
                                type="number"
                                placeholder="10"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-white/10 bg-transparent text-white hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !selectedPersonaId || !price}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Listing"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
