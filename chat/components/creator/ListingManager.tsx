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
            <div className="border-rp-muted/20 bg-rp-surface flex flex-col items-center justify-center rounded-xl border p-8 text-center">
                <div className="bg-rp-iris/20 mb-4 rounded-full p-4">
                    <TrendingUp className="text-rp-iris size-8" />
                </div>
                <h3 className="text-rp-text mb-2 text-lg font-semibold">
                    No Listings Yet
                </h3>
                <p className="text-rp-subtle text-sm">
                    Create your first listing to start earning Aether!
                </p>
            </div>
        )
    }

    return (
        <div className="border-rp-muted/20 bg-rp-surface overflow-hidden rounded-xl border">
            <Table>
                <TableHeader>
                    <TableRow className="border-rp-muted/20 hover:bg-transparent">
                        <TableHead className="text-rp-subtle">Soul</TableHead>
                        <TableHead className="text-rp-subtle">Price</TableHead>
                        <TableHead className="text-rp-subtle text-center">Sales</TableHead>
                        <TableHead className="text-rp-subtle text-center">Active</TableHead>
                        <TableHead className="text-rp-subtle text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {listings.map((listing) => (
                        <TableRow
                            key={listing.id}
                            className="border-rp-muted/10 hover:bg-rp-overlay"
                        >
                            {/* Soul */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <div className="bg-rp-base relative size-10 overflow-hidden rounded-lg">
                                        {listing.personas?.image_path ? (
                                            <Image
                                                src={listing.personas.image_path}
                                                alt={listing.personas.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="text-rp-muted flex size-full items-center justify-center text-lg font-bold">
                                                {listing.personas?.name?.[0] || "?"}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-rp-text font-medium">
                                            {listing.personas?.name || "Unknown"}
                                        </p>
                                        {listing.is_limited_edition && (
                                            <span className="text-rp-gold text-xs">
                                                Limited ({listing.quantity_remaining} left)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </TableCell>

                            {/* Price */}
                            <TableCell>
                                <span className="text-rp-iris font-medium">
                                    {listing.price_aether.toLocaleString()}
                                </span>
                                <span className="text-rp-muted ml-1 text-xs">Aether</span>
                            </TableCell>

                            {/* Sales */}
                            <TableCell className="text-center">
                                <span className="text-rp-text font-medium">
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
                                        className="text-rp-subtle hover:text-rp-text size-8"
                                    >
                                        <Edit2 className="size-4" />
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-rp-subtle hover:text-rp-love size-8"
                                                disabled={loadingId === listing.id}
                                            >
                                                {loadingId === listing.id ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="size-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="border-rp-muted/20 bg-rp-base">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-rp-text">
                                                    Remove Listing
                                                </AlertDialogTitle>
                                                <AlertDialogDescription className="text-rp-subtle">
                                                    This will deactivate the listing for{" "}
                                                    <span className="text-rp-text font-medium">
                                                        {listing.personas?.name}
                                                    </span>
                                                    . You can create a new listing later.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="border-rp-muted/20 text-rp-text hover:bg-rp-surface bg-transparent">
                                                    Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDelete(listing.id)}
                                                    className="bg-rp-love text-rp-base hover:bg-rp-love/80"
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
