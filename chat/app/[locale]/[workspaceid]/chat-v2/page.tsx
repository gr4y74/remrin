/**
 * Chat v2 Test Page
 * 
 * Access via: /[locale]/[workspaceid]/chat-v2
 * This page tests the new modular chat engine
 */

"use client"

import { ChatUIV2 } from '@/components/chat-v2'
import { useContext, useEffect, useState } from 'react'
import { RemrinContext } from '@/context/context'
import { useSearchParams } from 'next/navigation'
import { getPersonaById } from '@/db/personas'
import { UserTier } from '@/lib/chat-engine/types'

export default function ChatV2Page() {
    const searchParams = useSearchParams()
    const personaId = searchParams.get('persona')

    const { profile } = useContext(RemrinContext)

    const [persona, setPersona] = useState<{
        id: string
        name: string
        image_url?: string
        video_url?: string | null
        system_prompt?: string
    } | null>(null)

    // Load persona if specified
    useEffect(() => {
        async function loadPersona() {
            if (personaId) {
                try {
                    const data = await getPersonaById(personaId)
                    if (data) {
                        setPersona({
                            id: data.id,
                            name: data.name,
                            image_url: data.image_url || undefined,
                            video_url: data.video_url || undefined,
                            system_prompt: data.system_prompt || undefined
                        })
                    }
                } catch (error) {
                    console.error('Failed to load persona:', error)
                }
            }
        }
        loadPersona()
    }, [personaId])

    // Get user tier from profile (may not exist in all profile types)
    const userTier = ((profile as any)?.subscription_tier as UserTier) || 'free'

    return (
        <div className="h-full w-full bg-rp-base">
            {/* Debug banner */}
            <div className="bg-rp-gold/20 px-4 py-2 text-center text-sm text-rp-gold">
                🧪 Chat Engine v2 Test Mode | Tier: {userTier} |
                {persona ? ` Persona: ${persona.name}` : ' No persona'}
            </div>

            {/* Chat UI */}
            <div className="h-[calc(100%-40px)]">
                <ChatUIV2
                    personaId={persona?.id}
                    personaImage={persona?.image_url}
                    personaVideoUrl={persona?.video_url}
                    personaName={persona?.name}
                    personaSystemPrompt={persona?.system_prompt}
                    userTier={userTier}
                />
            </div>
        </div>
    )
}
