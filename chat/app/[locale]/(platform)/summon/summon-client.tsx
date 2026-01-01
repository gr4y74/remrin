"use client"

import { useEffect, useState } from "react"
import { useGacha, PullResult } from "@/lib/hooks/use-gacha"
import { GachaBanner } from "@/components/gacha/GachaBanner"
import { PullAnimation } from "@/components/gacha/PullAnimation"
import { createClient } from "@/lib/supabase/client"
import { IconStars, IconHistory } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"

const ParticleField = dynamic(() => import("@/components/ui/ParticleField").then(mod => mod.ParticleField), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#050505]" />
})

export default function SummonClient() {
    const [userId, setUserId] = useState<string | null>(null)
    const {
        pools,
        poolItems,
        performPull,
        fetchPools,
        fetchPoolItems,
        pulling,
        error: gachaError
    } = useGacha(userId)

    // Local state for the pull sequence
    const [isAnimating, setIsAnimating] = useState(false)
    const [pullResults, setPullResults] = useState<PullResult[]>([])
    // In a real app, we'd fetch this from the wallet table via Supabase or a context
    const [userBalance, setUserBalance] = useState(0)
    const router = useRouter()

    useEffect(() => {
        const initUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                // Fetch balance
                const { data: wallet } = await supabase
                    .from("wallets")
                    .select("balance_aether")
                    .eq("user_id", user.id)
                    .single()
                if (wallet) setUserBalance(wallet.balance_aether || 0)
            }
        }
        initUser()
    }, [])

    // Fetch pools on mount
    useEffect(() => {
        fetchPools()
    }, [fetchPools])

    // Load items for pools when pools are loaded
    useEffect(() => {
        pools.forEach(pool => {
            if (!poolItems[pool.id]) {
                fetchPoolItems(pool.id)
            }
        })
    }, [pools, fetchPoolItems, poolItems])

    const handleSinglePull = async (poolId: string) => {
        if (!userId) {
            router.push("/login")
            return
        }

        const results = await performPull(poolId, 1)
        if (results) {
            setPullResults(results)
            setIsAnimating(true)
            setUserBalance(prev => Math.max(0, prev - 10))
        }
    }

    const handleTenPull = async (poolId: string) => {
        if (!userId) {
            router.push("/login")
            return
        }

        const results = await performPull(poolId, 10)
        if (results) {
            setPullResults(results)
            setIsAnimating(true)
            setUserBalance(prev => Math.max(0, prev - 100))
        }
    }

    const handleAnimationComplete = () => {
        setIsAnimating(false)
        setPullResults([])
        // Refresh balance to be accurate
        if (userId) {
            // Re-fetch logic if needed, but optimistic update is usually fine for UI feedback
        }
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-rp-base text-white">
            {/* Removed starry background and gradient orbs */}

            <div className="relative z-10 container mx-auto px-4 py-8 md:px-8 md:py-12">
                {/* Header */}
                <header className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="font-tiempos-headline text-4xl font-bold text-white md:text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Soul Summon
                        </h1>
                        <p className="mt-2 text-white/50">
                            Call forth new entities from the Aether.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* History Link */}
                        <Link
                            href="/collection"
                            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md"
                        >
                            <IconHistory size={16} />
                            <span>My Grimoire</span>
                        </Link>

                        {/* Balance Display - Links to Market */}
                        <Link
                            href="/marketplace"
                            className="flex items-center gap-3 rounded-full border border-rp-gold/20 bg-rp-gold/5 px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(246,193,119,0.1)] hover:bg-rp-gold/10 hover:border-rp-gold/30 transition-all"
                        >
                            <IconStars className="text-rp-gold animate-pulse" size={20} />
                            <span className="font-mono text-lg font-bold text-rp-gold">
                                {userBalance.toLocaleString()}
                            </span>
                            <span className="text-xs uppercase tracking-wider text-rp-gold/60">Aether</span>
                        </Link>
                    </div>
                </header>

                {/* Main Gacha Area */}
                <div className="mx-auto max-w-6xl">
                    <GachaBanner
                        pools={pools}
                        poolItems={poolItems}
                        userBalance={userBalance}
                        onSinglePull={handleSinglePull}
                        onTenPull={handleTenPull}
                        isPulling={pulling}
                        className="shadow-[0_0_50px_rgba(196,167,231,0.1)] border-white/5 bg-black/40 backdrop-blur-sm"
                    />
                </div>

                {/* Loading / Empty State */}
                {pools.length === 0 && !gachaError && (
                    <div className="mt-20 text-center text-white/30">
                        <p className="animate-pulse">Aligning Aetheric flows...</p>
                    </div>
                )}

                {/* Error Toast/Message */}
                {gachaError && (
                    <div className="mx-auto mt-8 max-w-md rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-red-200 animate-in fade-in slide-in-from-bottom-4">
                        {gachaError}
                    </div>
                )}
            </div>

            {/* Animation Overlay */}
            {pullResults && pullResults.length > 0 && (
                <PullAnimation
                    results={pullResults}
                    onComplete={handleAnimationComplete}
                    onAddToLibrary={() => { }}
                    onConvertToAether={() => { }}
                />
            )}
        </div>
    )
}
