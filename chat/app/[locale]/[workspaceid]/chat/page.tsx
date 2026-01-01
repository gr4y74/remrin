"use client"

import { ChatUIV2 } from "@/components/chat-v2"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { RemrinContext } from "@/context/context"
import { getPersonaById } from "@/db/personas"
import { UserTier } from "@/lib/chat-engine/types"
import { useSearchParams } from "next/navigation"
import { useContext, useEffect } from "react"
export default function ChatPage() {
  // Chat V2 handles its own state and hotkeys internally



  const searchParams = useSearchParams()
  const personaId = searchParams.get("persona")

  const { setSelectedPersona, profile } = useContext(RemrinContext)

  const userTier = ((profile as any)?.subscription_tier as UserTier) || "free"

  // Load persona from query parameter
  useEffect(() => {
    const loadPersona = async () => {
      if (personaId) {
        try {
          const persona = await getPersonaById(personaId)
          if (persona) {
            setSelectedPersona(persona as any)
          }
        } catch (error) {
          console.error("Failed to load persona:", error)
        }
      }
    }
    loadPersona()
  }, [personaId, setSelectedPersona])

  const selectedPersona = (useContext(RemrinContext) as any).selectedPersona

  return (
    <ErrorBoundary>
      <ChatUIV2
        personaId={selectedPersona?.id || undefined}
        personaImage={selectedPersona?.image_url || undefined}
        personaName={selectedPersona?.name || undefined}
        personaSystemPrompt={selectedPersona?.system_prompt || undefined}
        userTier={userTier}
      />
    </ErrorBoundary>
  )
}
