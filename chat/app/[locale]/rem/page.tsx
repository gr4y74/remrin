"use client"

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { ChatSoloUI } from "@/components/chat-solo"

export default function RemSoloPage() {
    const REM_RIN_ID = "5720a26f-a61b-4641-ac19-d3a7b01c8bc8"

    return (
        <main className="h-screen w-full bg-background overflow-hidden relative z-50">
            <ErrorBoundary>
                <ChatSoloUI
                    personaId={REM_RIN_ID}
                    personaName="Rem Rin"
                    userTier="pro"
                />
            </ErrorBoundary>
        </main>
    )
}
