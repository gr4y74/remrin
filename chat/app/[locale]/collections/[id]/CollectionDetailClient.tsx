"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { CharacterCard } from "@/components/discovery/CharacterCard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trash2, Edit2, Globe, Lock, User, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TYPOGRAPHY, SPACING } from "@/lib/design-system"

interface Persona {
    id: string
    name: string
    image_url: string | null
    category: string | null
    total_chats: number
}

interface CollectionItem {
    id: string
    persona: Persona
}

interface Collection {
    id: string
    name: string
    description: string | null
    visibility: "PRIVATE" | "PUBLIC" | "UNLISTED"
    user_id: string
    items: CollectionItem[]
}

export function CollectionDetailClient() {
    const params = useParams()
    const id = params.id as string
    const [collection, setCollection] = useState<Collection | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCollection = useCallback(async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/collections/${id}`)
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to fetch collection")
            }
            const data = await res.json()
            setCollection(data.collection)
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchCollection()
    }, [fetchCollection])

    const handleRemoveItem = async (personaId: string, personaName: string) => {
        if (!confirm(`Are you sure you want to remove ${personaName} from this collection?`)) return

        try {
            const res = await fetch(`/api/collections/${id}/items`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ persona_id: personaId })
            })

            if (res.ok) {
                toast.success(`Removed ${personaName}`)
                // Update local state
                setCollection(prev => {
                    if (!prev) return null
                    return {
                        ...prev,
                        items: prev.items.filter(item => item.persona.id !== personaId)
                    }
                })
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to remove item")
            }
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="text-rp-iris size-12 animate-spin" />
            </div>
        )
    }

    if (error || !collection) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
                <h2 className="text-2xl font-bold text-rp-rose">Error</h2>
                <p className="mt-2 text-rp-subtle">{error || "Collection not found"}</p>
                <Link href="/" className="mt-4 text-rp-iris hover:underline">
                    Go back home
                </Link>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-4">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-rp-subtle transition-colors hover:text-rp-text"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Home
                    </Link>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className={cn(TYPOGRAPHY.heading.h1, "text-rp-rose")}>
                                {collection.name}
                            </h1>
                            <div className="bg-rp-muted/10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-rp-subtle">
                                {collection.visibility === "PUBLIC" ? <Globe className="size-3" /> : collection.visibility === "PRIVATE" ? <Lock className="size-3" /> : <User className="size-3" />}
                                {collection.visibility}
                            </div>
                        </div>
                        {collection.description && (
                            <p className="max-w-2xl text-rp-subtle">
                                {collection.description}
                            </p>
                        )}
                        <p className="text-sm text-rp-muted">
                            {collection.items.length} {collection.items.length === 1 ? 'character' : 'characters'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="border-rp-muted/20 text-rp-text hover:bg-rp-muted/10">
                        <Edit2 className="mr-2 size-4" />
                        Edit Collection
                    </Button>
                </div>
            </div>

            {/* Grid */}
            {collection.items.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {collection.items.map((item) => (
                        <div key={item.id} className="group relative">
                            <CharacterCard
                                id={item.persona.id}
                                name={item.persona.name}
                                imageUrl={item.persona.image_url}
                                category={item.persona.category}
                                totalChats={item.persona.total_chats}
                            />
                            {/* Remove button (bottom left) */}
                            <button
                                onClick={() => handleRemoveItem(item.persona.id, item.persona.name)}
                                className="absolute bottom-4 left-4 z-10 hidden rounded-full bg-rp-love/80 p-2 text-rp-base transition-all hover:bg-rp-love group-hover:block"
                                title="Remove from collection"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rp-muted/20 p-12 text-center">
                    <p className="text-lg text-rp-subtle">This collection is empty.</p>
                    <p className="mt-2 text-sm text-rp-muted">Explore characters and add them to this collection!</p>
                    <Button asChild className="mt-6 bg-rp-iris text-rp-base hover:bg-rp-iris/90">
                        <Link href="/">Discover Characters</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
