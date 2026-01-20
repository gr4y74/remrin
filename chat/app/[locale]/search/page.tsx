import { SearchClient } from "./SearchClient"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Search Souls",
    description: "Find and connect with AI Souls"
}

export default function SearchPage() {
    return (
        <main className="flex min-h-screen flex-col bg-rp-base">
            <SearchClient />
        </main>
    )
}
