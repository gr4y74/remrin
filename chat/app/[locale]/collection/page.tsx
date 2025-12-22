"use client"

import { useEffect, useState } from "react"
import { CollectionGrid } from "@/components/collection/CollectionGrid"
import { CollectionStats } from "@/components/collection/CollectionStats"
import { useCollection } from "@/hooks/use-collection"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function CollectionPage() {
    const [userId, setUserId] = useState<string | undefined>(undefined)

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id)
        }
        getUser()
    }, [])

    const { souls, stats, pityInfo, loading, error } = useCollection(userId)

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    My Collection
                </h1>
                <p className="mt-1 text-muted-foreground">
                    View all the Souls you&apos;ve summoned from the Aether Gate
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                {/* Main Content */}
                <CollectionGrid souls={souls} loading={loading} />

                {/* Sidebar Stats */}
                <div className="hidden lg:block">
                    <div className="sticky top-8">
                        <CollectionStats stats={stats} pityInfo={pityInfo} />
                    </div>
                </div>
            </div>
        </div>
    )
}
