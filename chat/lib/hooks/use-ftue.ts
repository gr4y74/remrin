"use client"

import { useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { RemrinContext } from "@/context/context"
import { MOTHER_OF_SOULS_NAME, isMotherOfSouls } from "@/lib/forge/is-mother-chat"

/**
 * FTUE (First-Time User Experience) Hook
 * 
 * Detects when a new user has no chats and redirects them
 * to The Mother of Souls for the onboarding ritual.
 * 
 * The "Cold Start" redirect as per MoS Protocol.
 */
export function useFTUERedirect() {
    const router = useRouter()
    const pathname = usePathname()
    const { profile, chats, workspaces, personas, selectedWorkspace } = useContext(RemrinContext)
    const [hasChecked, setHasChecked] = useState(false)
    const [isNewUser, setIsNewUser] = useState(false)

    useEffect(() => {
        // Only run once per session
        if (hasChecked) return

        // Wait for all data to load
        if (!profile || chats === undefined || personas === undefined) {
            return
        }

        // Don't redirect if already in a chat or on protected pages
        const protectedPaths = ['/login', '/signup', '/callback', '/api']
        if (protectedPaths.some(path => pathname?.includes(path))) {
            setHasChecked(true)
            return
        }

        // Check if this is a new user (no chats)
        if (chats.length === 0) {
            console.log("🕯️ [FTUE] New user detected - initiating Mother of Souls onboarding...")
            setIsNewUser(true)

            // Find the Mother of Souls in user's personas
            const motherPersona = personas.find(p => isMotherOfSouls(p))

            if (motherPersona && selectedWorkspace) {
                // Mother exists - redirect to create a new chat with her
                console.log("🕯️ [FTUE] Mother found in collection - redirecting to Soul Forge...")

                // Store flag so we know to auto-select Mother
                sessionStorage.setItem('ftue_start_mother_chat', motherPersona.id)

                // Redirect to chat page where Mother will be auto-selected
                router.push(`/${selectedWorkspace.id}/chat`)
            } else if (selectedWorkspace) {
                // Mother doesn't exist yet - still redirect, will show empty state
                console.log("🕯️ [FTUE] Mother not found - user should see onboarding prompt")
                router.push(`/${selectedWorkspace.id}/chat`)
            }
        }

        setHasChecked(true)
    }, [profile, chats, personas, selectedWorkspace, pathname, hasChecked, router])

    return { isNewUser, hasChecked }
}

/**
 * Get the Mother of Souls persona from the user's collection
 */
export function useMotherOfSouls() {
    const { personas } = useContext(RemrinContext)

    const motherPersona = personas?.find(p => isMotherOfSouls(p)) || null
    const hasMother = motherPersona !== null

    return { motherPersona, hasMother }
}

/**
 * Check if FTUE should auto-start a Mother chat
 */
export function shouldStartMotherChat(): string | null {
    if (typeof window === 'undefined') return null

    const motherPersonaId = sessionStorage.getItem('ftue_start_mother_chat')
    if (motherPersonaId) {
        // Clear the flag after reading
        sessionStorage.removeItem('ftue_start_mother_chat')
        return motherPersonaId
    }
    return null
}
