"use client"

import { RemrinContext } from "@/context/context"
import { IconPhoto } from "@tabler/icons-react"
import { FC, useContext } from "react"
import { cn } from "@/lib/utils"

interface ChatBackgroundToggleProps {
    className?: string
}

export const ChatBackgroundToggle: FC<ChatBackgroundToggleProps> = ({
    className
}) => {
    const { chatBackgroundEnabled, setChatBackgroundEnabled, selectedPersona } = useContext(RemrinContext)

    // Only show if there's a selected persona
    if (!selectedPersona) return null

    const handleToggle = () => {
        setChatBackgroundEnabled(!chatBackgroundEnabled)
    }

    return (
        <button
            onClick={handleToggle}
            className={cn(
                "group relative flex h-[36px] w-[36px] items-center justify-center rounded-lg transition-all",
                chatBackgroundEnabled
                    ? "bg-rp-iris/20 text-rp-iris hover:bg-rp-iris/30"
                    : "bg-rp-overlay/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text",
                className
            )}
            title={chatBackgroundEnabled ? "Hide Background" : "Show Background"}
        >
            <IconPhoto
                size={20}
                className={cn(
                    "transition-transform",
                    chatBackgroundEnabled && "scale-110"
                )}
            />

            {/* Active indicator */}
            {chatBackgroundEnabled && (
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rp-iris animate-pulse" />
            )}
        </button>
    )
}
