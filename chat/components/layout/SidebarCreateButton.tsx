"use client"

import { useContext } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { IconPlus, IconSparkles } from "@tabler/icons-react"
import { RemrinContext } from "@/context/context"
import { isMotherOfSouls } from "@/lib/forge/is-mother-chat"

interface SidebarCreateButtonProps {
    isExpanded: boolean
}

/**
 * SidebarCreateButton - "Craft a Soul" button
 * 
 * Starts the Mother of Souls onboarding ritual by selecting her
 * from the user's persona collection and starting a new chat.
 */
export function SidebarCreateButton({ isExpanded }: SidebarCreateButtonProps) {
    const router = useRouter()
    const {
        personas,
        selectedWorkspace,
        setSelectedPersona,
        setSelectedChat
    } = useContext(RemrinContext)

    const handleCraftSoul = () => {
        // Find Mother of Souls in user's persona collection
        const motherPersona = personas?.find(p => isMotherOfSouls(p))

        if (motherPersona && selectedWorkspace) {
            console.log("🕯️ [Craft Soul] Starting Soul Forge with Mother of Souls...")

            // Select Mother as the current persona
            setSelectedPersona(motherPersona)

            // Clear any existing chat to start fresh
            setSelectedChat(null)

            // Navigate to chat - a new chat will be created with Mother
            router.push(`/${selectedWorkspace.id}/chat`)
        } else {
            // Mother not in collection - go to discover or show message
            console.log("🕯️ [Craft Soul] Mother not found in collection")

            if (selectedWorkspace) {
                // Still navigate to chat, the intro message will guide them
                router.push(`/${selectedWorkspace.id}/chat`)
            }
        }
    }

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

