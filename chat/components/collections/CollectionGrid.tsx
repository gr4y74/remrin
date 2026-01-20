"use client"

import { CollectionCard } from "./CollectionCard"
import { cn } from "@/lib/utils"

interface Collection {
    id: string
    name: string
    description: string | null
    visibility: "PRIVATE" | "PUBLIC" | "UNLISTED"
    cover_image_url: string | null
    items?: { count: number }[]
}

interface CollectionGridProps {
    collections: Collection[]
    className?: string
}

export function CollectionGrid({ collections, className }: CollectionGridProps) {
    if (!collections || collections.length === 0) {
        return (
            <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-rp-muted/20 p-8 text-center text-rp-subtle">
                <p>No collections found.</p>
                <p className="mt-2 text-sm">Create your first collection to organize your favorite characters!</p>
            </div>
        )
    }

    return (
        <div className={cn(
            "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            className
        )}>
            {collections.map((collection) => (
                <CollectionCard
                    key={collection.id}
                    id={collection.id}
                    name={collection.name}
                    description={collection.description}
                    itemCount={collection.items?.[0]?.count ?? 0}
                    visibility={collection.visibility}
                    coverImageUrl={collection.cover_image_url}
                />
            ))}
        </div>
    )
}
