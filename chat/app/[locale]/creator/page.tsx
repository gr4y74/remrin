import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getWallet } from "@/lib/wallet"
import { getListingsBySeller } from "@/lib/marketplace"
import { CreatorDashboard } from "@/components/creator"

export default async function CreatorPage() {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Check if user is a creator or has any listings
    const [wallet, { data: listings }] = await Promise.all([
        getWallet(supabase, user.id),
        getListingsBySeller(supabase, user.id, true)
    ])

    const isCreator = wallet?.is_creator || false
    const hasListings = listings.length > 0

    // Redirect if not a creator and has no listings
    if (!isCreator && !hasListings) {
        redirect("/")
    }

    return <CreatorDashboard userId={user.id} />
}
