"use client"

import { useContext, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { IconSparkles } from "@tabler/icons-react"
import { RemrinContext } from "@/context/context"
import { isMotherOfSouls, MOTHER_OF_SOULS_ID } from "@/lib/forge/is-mother-chat"
import { createClient } from "@/lib/supabase/client"

interface SidebarCreateButtonProps {
    isExpanded: boolean
}

/**
 * SidebarCreateButton - "Craft a Soul" button
 * 
 * Starts the Mother of Souls onboarding ritual.
 * The Mother of Souls is a LEGENDARY card that every user has access to.
 */
export function SidebarCreateButton({ isExpanded }: SidebarCreateButtonProps) {
    const router = useRouter()
    const {
        personas,
        selectedWorkspace,
        setSelectedPersona,
        setSelectedChat
    } = useContext(RemrinContext)

    const handleCraftSoul = useCallback(async () => {
        // First check user's persona collection
        let motherPersona = personas?.find(p => isMotherOfSouls(p))

        // If not found, fetch the master Mother (PUBLIC official)
        if (!motherPersona) {
            console.log("🕯️ [Craft Soul] Fetching Mother of Souls from master template...")
            const supabase = createClient()
            const { data: masterMother } = await supabase
                .from('personas')
                .select('*')
                .eq('id', MOTHER_OF_SOULS_ID)
                .single()

            if (masterMother) {
                motherPersona = masterMother
            }
        }

        if (motherPersona) {
            console.log("🕯️ [Craft Soul] Starting Soul Forge with Mother of Souls...")

            // Select Mother as the current persona
            setSelectedPersona(motherPersona)

            // Clear any existing chat to start fresh
            setSelectedChat(null)

            // Navigate to chat
            if (selectedWorkspace) {
                router.push(`/${selectedWorkspace.id}/chat`)
            } else {
                // For guests, go to login first
                router.push('/login?redirect=soul-forge')
            }
        } else {
            console.log("🕯️ [Craft Soul] Mother not available - redirecting to login")
            router.push('/login?redirect=soul-forge')
        }
    }, [personas, selectedWorkspace, setSelectedPersona, setSelectedChat, router])

    return (
        <div className="p-2">
            <button
                onClick={handleCraftSoul}
                className={cn(
                    "flex min-h-[44px] w-full items-center rounded-xl transition-all",
                    "border border-rp-muted/30 bg-rp-surface",
                    "hover:border-rp-iris/50 hover:bg-rp-overlay",
                    isExpanded ? "gap-3 px-4 py-2.5" : "justify-center px-3 py-2.5"
                )}
            >
                {/* Icon */}
                <div className={cn(
                    "shrink-0 flex items-center justify-center",
                    "size-6 rounded-lg bg-rp-iris/10 text-rp-iris"
                )}>
                    <IconSparkles size={16} strokeWidth={2.5} />
                </div>

                {/* Text - only when expanded */}
                <motion.span
                    className="font-tiempos-text text-sm font-medium text-rp-text whitespace-nowrap overflow-hidden"
                    initial={false}
                    animate={{
                        opacity: isExpanded ? 1 : 0,
                        width: isExpanded ? "auto" : 0
                    }}
                    transition={{ duration: 0.2 }}
                >
                    Craft a Soul
                </motion.span>
            </button>
        </div>
    )
}


