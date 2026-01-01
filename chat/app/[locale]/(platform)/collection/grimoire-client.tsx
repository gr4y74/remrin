"use client"

import { useEffect, useState } from "react"
import { CollectionGrid } from "@/components/collection/CollectionGrid"
import { CollectionStats } from "@/components/collection/CollectionStats"
import { useCollection } from "@/hooks/use-collection"
import { createClient } from "@/lib/supabase/client"
import { TYPOGRAPHY } from "@/lib/design-system"
import { IconBook } from "@tabler/icons-react"

export default function GrimoireClient() {
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

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505] text-red-400">
                <p>Error loading Grimoire: {error}</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-rp-iris/5 blur-[100px]" />
                <div className="absolute bottom-[10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-rp-rose/5 blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto max-w-7xl px-4 py-8 md:px-8">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-rp-iris/10 text-rp-iris">
                                <IconBook size={28} />
                            </div>
                            <h1 className={`${TYPOGRAPHY.heading.h1} bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent`}>
                                Grimoire
                            </h1>
                        </div>
                        <p className="text-white/50 pl-1">
                            {loading ? "Opening the tome..." : `You have collected ${souls.length} soul fragments.`}
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                    {/* Main Content */}
                    <CollectionGrid souls={souls} loading={loading} />

                    {/* Sidebar Stats */}
                    <div className="hidden lg:block">
                        <div className="sticky top-8 space-y-6">
                            <CollectionStats stats={stats} pityInfo={pityInfo} />

                            {/* Lore snippet or extra decorative element */}
                            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
                                <h3 className="mb-2 font-tiempos-headline text-lg font-bold text-rp-gold">Archivist's Note</h3>
                                <p className="text-sm italic text-white/40 leading-relaxed">
                                    "The souls you summon are bound to this Grimoire. As you deepen your bond, their true power will manifest."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
