"use client"

import { useState, useEffect } from "react"
import { GachaBanner } from "@/components/gacha/GachaBanner"
import { PullAnimation } from "@/components/gacha/PullAnimation"
import { PullHistory } from "@/components/gacha/PullHistory"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, History, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useGacha, PullResult } from "@/lib/hooks/use-gacha"

export default function SummonPage() {
    const [activeTab, setActiveTab] = useState("summon")
    const [userId, setUserId] = useState<string | null>(null)
    const [userBalance, setUserBalance] = useState(0)
    const [pullResults, setPullResults] = useState<PullResult[] | null>(null)

    // Get user ID on mount
    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)

                // Get wallet balance
                const { data: wallet } = await supabase
                    .from("wallets")
                    .select("balance_aether")
                    .eq("user_id", user.id)
                    .single()

                if (wallet) {
                    setUserBalance(wallet.balance_aether || 0)
                }
            }
        }
        getUser()
    }, [])

    // Use the gacha hook
    const {
        pools,
        poolItems,
        loading,
        pulling,
        error,
        fetchPools,
        fetchPoolItems,
        performPull
    } = useGacha(userId)

    // Fetch pools on mount
    useEffect(() => {
        fetchPools().then(fetchedPools => {
            // Fetch items for each pool
            for (const pool of fetchedPools) {
                fetchPoolItems(pool.id)
            }
        })
    }, [fetchPools, fetchPoolItems])

    const handleSinglePull = async (poolId: string) => {
        const results = await performPull(poolId, 1)
        if (results) {
            setPullResults(results)
            // Refresh balance
            const supabase = createClient()
            const { data: wallet } = await supabase
                .from("wallets")
                .select("balance_aether")
                .eq("user_id", userId)
                .single()
            if (wallet) {
                setUserBalance(wallet.balance_aether || 0)
            }
        }
    }

    const handleTenPull = async (poolId: string) => {
        const results = await performPull(poolId, 10)
        if (results) {
            setPullResults(results)
            // Refresh balance
            const supabase = createClient()
            const { data: wallet } = await supabase
                .from("wallets")
                .select("balance_aether")
                .eq("user_id", userId)
                .single()
            if (wallet) {
                setUserBalance(wallet.balance_aether || 0)
            }
        }
    }

    const handleClosePullResults = () => {
        setPullResults(null)
    }

    if (loading && pools.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="font-tiempos-headline bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-5xl">
                    Soul Summons
                </h1>
                <p className="text-muted-foreground mt-2">
                    Spend Aether to summon powerful Souls from across the multiverse
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-amber-400">
                    <Sparkles className="size-4" />
                    <span className="font-semibold">{userBalance} Aether</span>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-4 text-center">
                    {error}
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="summon" className="gap-2">
                        <Sparkles className="size-4" />
                        Summon
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                        <History className="size-4" />
                        History
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="summon" className="mt-8">
                    <GachaBanner
                        pools={pools}
                        poolItems={poolItems}
                        userBalance={userBalance}
                        onSinglePull={handleSinglePull}
                        onTenPull={handleTenPull}
                        isPulling={pulling}
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-8">
                    <PullHistory />
                </TabsContent>
            </Tabs>

            {/* Pull Animation Overlay */}
            {pullResults && (
                <PullAnimation
                    results={pullResults}
                    onComplete={handleClosePullResults}
                    onAddToLibrary={(personaId) => {
                        console.log("Add to library:", personaId)
                    }}
                    onConvertToAether={(pullId) => {
                        console.log("Convert to aether:", pullId)
                    }}
                />
            )}
        </div>
    )
}
