"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FolderPlus, Check, Loader2, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Collection {
    id: string
    name: string
    item_count?: number
}

interface AddToCollectionModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    personaId: string
    personaName: string
}

export function AddToCollectionModal({
    isOpen,
    onOpenChange,
    personaId,
    personaName
}: AddToCollectionModalProps) {
    const [collections, setCollections] = useState<Collection[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newCollectionName, setNewCollectionName] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (isOpen) {
            fetchCollections()
        }
    }, [isOpen])

    const fetchCollections = async () => {
        setIsLoading(true)
        try {
            const res = await fetch("/api/collections")
            const data = await res.json()
            if (data.collections) {
                setCollections(data.collections)
            }
        } catch (error) {
            console.error("Failed to fetch collections:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddToCollection = async (collectionId: string) => {
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/collections/${collectionId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ persona_id: personaId })
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(`Added ${personaName} to collection`)
                onOpenChange(false)
            } else {
                toast.error(data.error || "Failed to add to collection")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCollectionName.trim()) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCollectionName })
            })
            const data = await res.json()

            if (res.ok) {
                toast.success("Collection created")
                setNewCollectionName("")
                setIsCreating(false)
                // Add to new collection immediately?
                handleAddToCollection(data.collection.id)
            } else {
                toast.error(data.error || "Failed to create collection")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-rp-surface border-rp-muted/20 sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-rp-rose">Add to Collection</DialogTitle>
                    <DialogDescription className="text-rp-subtle">
                        Organize <strong>{personaName}</strong> into one of your collections.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isCreating ? (
                        <form onSubmit={handleCreateCollection} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-rp-text">Collection Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. My Favorites"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    autoFocus
                                    className="bg-rp-base border-rp-muted/20 text-rp-text focus:border-rp-iris/50"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 text-rp-subtle hover:text-rp-text"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!newCollectionName.trim() || isSubmitting}
                                    className="flex-1 bg-rp-iris text-rp-base hover:bg-rp-iris/90"
                                >
                                    {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FolderPlus className="mr-2 size-4" />}
                                    Create & Add
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-rp-subtle" />
                                <Input
                                    placeholder="Search collections..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-rp-base border-rp-muted/20 pl-10 text-rp-text focus:border-rp-iris/50"
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="text-rp-iris size-8 animate-spin" />
                                    </div>
                                ) : filteredCollections.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredCollections.map((collection) => (
                                            <button
                                                key={collection.id}
                                                onClick={() => handleAddToCollection(collection.id)}
                                                disabled={isSubmitting}
                                                className="hover:bg-rp-muted/10 group flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-rp-iris/10 flex size-9 items-center justify-center rounded-lg text-rp-iris">
                                                        <Plus className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-rp-text">{collection.name}</p>
                                                        {collection.item_count !== undefined && (
                                                            <p className="text-xs text-rp-subtle">{collection.item_count} items</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-rp-iris opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Check className="size-4" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <p className="text-sm text-rp-subtle">No collections found.</p>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={() => setIsCreating(true)}
                                variant="outline"
                                className="border-rp-iris/30 text-rp-iris hover:bg-rp-iris/10 w-full"
                            >
                                <FolderPlus className="mr-2 size-4" />
                                Create New Collection
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
