"use client"

import { useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { MarketListingWithPersona, removeListing } from "@/lib/marketplace"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Trash2, Edit2, TrendingUp, Loader2 } from "lucide-react"

interface ListingManagerProps {
    listings: MarketListingWithPersona[]
    userId: string
    onRefresh: () => void
}

export function ListingManager({ listings, userId, onRefresh }: ListingManagerProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const supabase = createClient()

    const handleToggleActive = async (listing: MarketListingWithPersona) => {
        setLoadingId(listing.id)
        try {
            await supabase
                .from("market_listings")
                .update({ is_active: !listing.is_active })
                .eq("id", listing.id)

            onRefresh()
        } catch (error) {
            console.error("Error toggling listing:", error)
        } finally {
            setLoadingId(null)
        }
    }

    const handleDelete = async (listingId: string) => {
        setLoadingId(listingId)
        try {
            await removeListing(supabase, userId, listingId)
            onRefresh()
        } catch (error) {
            console.error("Error deleting listing:", error)
        } finally {
            setLoadingId(null)
        }
    }

    if (listings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                <div className="mb-4 rounded-full bg-purple-500/20 p-4">
                    <TrendingUp className="size-8 text-purple-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                    No Listings Yet
                </h3>
                <p className="text-sm text-zinc-400">
                    Create your first listing to start earning Aether!
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Soul</TableHead>
                        <TableHead className="text-zinc-400">Price</TableHead>
                        <TableHead className="text-zinc-400 text-center">Sales</TableHead>
                        <TableHead className="text-zinc-400 text-center">Active</TableHead>
                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {listings.map((listing) => (
                        <TableRow
                            key={listing.id}
                            className="border-white/5 hover:bg-white/5"
                        >
                            {/* Soul */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="relative size-10 overflow-hidden rounded-lg bg-zinc-800">
                                        {listing.personas?.image_path ? (
                                            <Image
                                                src={listing.personas.image_path}
                                                alt={listing.personas.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-lg font-bold text-zinc-600">
                                                {listing.personas?.name?.[0] || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">
                                            {listing.personas?.name || "Unknown"}
                                        </p>
                                        {listing.is_limited_edition && (
                                            <span className="text-xs text-amber-400">
                                                Limited ({listing.quantity_remaining} left)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </TableCell>

                            {/* Price */}
                            <TableCell>
                                <span className="font-medium text-purple-400">
                                    {listing.price_aether.toLocaleString()}
                                </span>
                                <span className="ml-1 text-xs text-zinc-500">Aether</span>
                            </TableCell>

                            {/* Sales */}
                            <TableCell className="text-center">
                                <span className="font-medium text-white">
                                    {listing.total_sales}
                                </span>
                            </TableCell>

                            {/* Active Toggle */}
                            <TableCell className="text-center">
                                <Switch
                                    checked={listing.is_active}
                                    onCheckedChange={() => handleToggleActive(listing)}
                                    disabled={loadingId === listing.id}
                                />
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-zinc-400 hover:text-white"
                                    >
                                        <Edit2 className="size-4" />
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-zinc-400 hover:text-red-400"
                                                disabled={loadingId === listing.id}
                                            >
                                                {loadingId === listing.id ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="size-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="border-white/10 bg-zinc-900">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-white">
                                                    Remove Listing
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-zinc-400">
                                                    This will deactivate the listing for{" "}
                                                    <span className="font-medium text-white">
                                                        {listing.personas?.name}
                                                    </span>
                                                    . You can create a new listing later.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(listing.id)}
                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                >
                                                    Remove
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
