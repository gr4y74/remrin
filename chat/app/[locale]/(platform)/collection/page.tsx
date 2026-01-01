import { Metadata } from "next"
import GrimoireClient from "./grimoire-client"

export const metadata: Metadata = {
    title: "My Grimoire | Remrin.ai",
    description: "View your collection of summoned souls and their stats."
}

export default function GrimoirePage() {
    return <GrimoireClient />
}
