"use client"

import { IconWaveSine } from "@tabler/icons-react"
import Link from "next/link"
import { FC } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface VoiceSettingsButtonProps {
    personaId: string
    variant?: "default" | "ghost" | "outline"
    size?: "sm" | "icon"
    className?: string
}

export const VoiceSettingsButton: FC<VoiceSettingsButtonProps> = ({
    personaId,
    variant = "default",
    size = "icon",
    className
}) => {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <Link
                        href={`/studio/audio?persona=${personaId}`}
                        className={cn(
                            "inline-flex items-center justify-center transition-colors",
                            size === "icon" && "h-10 w-10 rounded-full",
                            size === "sm" && "h-8 px-3 rounded-lg text-xs",
                            variant === "default" && "bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 hover:text-rp-iris",
                            variant === "ghost" && "hover:bg-rp-overlay text-rp-subtle hover:text-rp-text",
                            variant === "outline" && "border border-rp-muted/20 text-rp-text hover:bg-rp-overlay",
                            className
                        )}
                    >
                        <IconWaveSine size={20} />
                        {size === "sm" && <span className="ml-2 font-medium">Voice</span>}
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    Configure voice
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
