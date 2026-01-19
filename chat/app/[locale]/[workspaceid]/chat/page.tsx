"use client"

import { ChatUIV2 } from "@/components/chat-v2"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { RemrinContext } from "@/context/context"
import { getPersonaById } from "@/db/personas"
import { UserTier } from "@/lib/chat-engine/types"
import { useSearchParams } from "next/navigation"
import { useContext, useEffect } from "react"
import { useFTUERedirect, shouldStartMotherChat } from "@/lib/hooks/use-ftue"

export default function ChatPage() {
  // Check for FTUE redirect
  useFTUERedirect()
  // Chat V2 handles its own state and hotkeys internally



  const searchParams = useSearchParams()
  const personaId = searchParams.get("persona")

  const { setSelectedPersona, profile, personas } = useContext(RemrinContext)

  const userTier = ((profile as any)?.subscription_tier as UserTier) || "free"

  // Load persona logic
  useEffect(() => {
    // Priority: 1. URL Param, 2. FTUE Flag
    const pid = personaId || shouldStartMotherChat()

    if (pid) {
      const p = (personas as any[])?.find(x => x.id === pid)
      if (p) {
        setSelectedPersona(p)
      } else {
        // Fallback to async fetch if not in context yet
        getPersonaById(pid).then(p => {
          if (p) setSelectedPersona(p as any)
        })
      }
    }
  }, [personaId, personas, setSelectedPersona])

  const selectedPersona = (useContext(RemrinContext) as any).selectedPersona

  return (
    <ErrorBoundary>
      <ChatUIV2
        personaId={selectedPersona?.id || undefined}
        personaImage={selectedPersona?.image_url || undefined}
        personaVideoUrl={selectedPersona?.video_url || undefined}
        personaName={selectedPersona?.name || undefined}
        personaSystemPrompt={selectedPersona?.system_prompt || undefined}
        personaIntroMessage={selectedPersona?.intro_message || undefined}
        welcomeAudioUrl={selectedPersona?.welcome_audio_url || undefined}
        userTier={userTier}
      />
    </ErrorBoundary>
  )
}
