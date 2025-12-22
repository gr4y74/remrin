"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface PullRecord {
    id: string
    persona_id: string
    rarity: string
    pulled_at: string
    persona?: {
        name: string
        image_url: string
    }
}

const RARITY_COLORS: Record<string, string> = {
    common: "border-gray-500",
    uncommon: "border-green-500",
    rare: "border-blue-500",
    epic: "border-purple-500",
    legendary: "border-yellow-500",
}

export function PullHistory() {
    const [pulls, setPulls] = useState<PullRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<string>("all")

    useEffect(() => {
        const fetchHistory = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from("user_pulls")
                .select(`
                    id,
                    persona_id,
                    rarity,
                    pulled_at,
                    persona:personas(name, image_url)
                `)
                .eq("user_id", user.id)
                .order("pulled_at", { ascending: false })
                .limit(100)

            if (!error && data) {
                // Transform the data to match our interface (Supabase returns array for single joins)
                const transformed: PullRecord[] = data.map((item: any) => ({
                    ...item,
                    persona: Array.isArray(item.persona) ? item.persona[0] : item.persona
                }))
                setPulls(transformed)
            }
            setLoading(false)
        }

        fetchHistory()
    }, [])

    const filteredPulls = filter === "all"
        ? pulls
        : pulls.filter(p => p.rarity === filter)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {["all", "legendary", "epic", "rare", "uncommon", "common"].map((r) => (
                    <button
                        key={r}
                        onClick={() => setFilter(r)}
                        className={cn(
                            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                            filter === r
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                ))}
            </div>

            {/* Pull List */}
            {filteredPulls.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                    No pulls yet. Visit the Soul Summons to try your luck!
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {filteredPulls.map((pull) => (
                        <div
                            key={pull.id}
                            className={cn(
                                "group relative overflow-hidden rounded-lg border-2 bg-card transition-transform hover:scale-105",
                                RARITY_COLORS[pull.rarity] || "border-border"
                            )}
                        >
                            <div className="aspect-square">
                                <img
                                    src={pull.persona?.image_url || "/placeholder-soul.png"}
                                    alt={pull.persona?.name || "Soul"}
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="p-2">
                                <p className="truncate text-sm font-medium">
                                    {pull.persona?.name || "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(pull.pulled_at), "MMM d, yyyy")}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
