"use client"

import { ChatUIV2 } from "@/components/chat-v2"
import { RemrinContext } from "@/context/context"
import { UserTier } from "@/lib/chat-engine/types"
import { useContext } from "react"

export default function ChatIDPage() {
  const { profile, selectedPersona } = useContext(RemrinContext)
  const userTier = ((profile as any)?.subscription_tier as UserTier) || "free"

  return (
    <ChatUIV2
      personaId={selectedPersona?.id || undefined}
      personaImage={selectedPersona?.image_url || undefined}
      personaVideoUrl={selectedPersona?.video_url || undefined}
      personaName={selectedPersona?.name || undefined}
      personaSystemPrompt={selectedPersona?.system_prompt || undefined}
      userTier={userTier}
    />
  )
}
