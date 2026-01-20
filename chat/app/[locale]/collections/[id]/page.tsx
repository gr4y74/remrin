import { CollectionDetailClient } from "./CollectionDetailClient"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Collection Details",
    description: "View and manage characters in your collection"
}

export default function CollectionDetailPage() {
    return (
        <main className="flex min-h-screen flex-col bg-rp-base">
            <CollectionDetailClient />
        </main>
    )
}
