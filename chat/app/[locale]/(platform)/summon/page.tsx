import { Metadata } from "next"
import SummonClient from "./summon-client"

export const metadata: Metadata = {
    title: "Soul Summon | Remrin.ai",
    description: "Call forth new entities from the Aether. Summon legendary souls to join your journey."
}

export default function SummonPage() {
    return <SummonClient />
}
