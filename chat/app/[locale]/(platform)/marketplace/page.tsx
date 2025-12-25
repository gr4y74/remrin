import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { MarketplacePage } from "@/components/marketplace"
import { getActiveListings } from "@/lib/marketplace"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Soul Bazaar | Remrin",
    description: "Browse and purchase unique AI souls from creators. Find limited editions, trending companions, and build your collection.",
    openGraph: {
        title: "Soul Bazaar | Remrin",
        description: "Browse and purchase unique AI souls from creators. Find limited editions, trending companions, and build your collection."
    }
}

export default async function MarketplaceRoute() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user for balance
    const {
        data: { user }
    } = await supabase.auth.getUser()

    let userBalance = 0

    if (user) {
        const { data: wallet } = await supabase
            .from("wallets")
            .select("balance_aether")
            .eq("user_id", user.id)
            .single()

        userBalance = wallet?.balance_aether ?? 0
    }

    // Fetch active listings
    const { data: listings } = await getActiveListings(supabase, {
        sort: "newest",
        limit: 50
    })

    // Fetch categories
    let categories: Array<{ id: string; name: string; slug: string; color: string | null }> = []
    try {
        const { data: categoriesData } = await supabase
            .from("categories")
            .select("id, name, slug, color")
            .eq("is_active", true)
            .order("sort_order", { ascending: true })

        categories = categoriesData ?? []
    } catch (error) {
        console.error("Error fetching categories:", error)
    }

    return (
        <MarketplacePage
            initialListings={listings}
            categories={categories}
            userBalance={userBalance}
        />
    )
}
