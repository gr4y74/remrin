"use client"

import { FC, useContext } from "react"
import { IconPhoto, IconDotsVertical, IconArrowLeft, IconUser } from "@tabler/icons-react"
import { RemrinContext } from "@/context/context"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ChatHeaderProps {
    personaName?: string
    personaImage?: string
    onBack?: () => void
}

export const ChatHeader: FC<ChatHeaderProps> = ({
    personaName,
    personaImage,
    onBack
}) => {
    const { chatBackgroundEnabled, setChatBackgroundEnabled, setIsCharacterPanelOpen } = useContext(RemrinContext)

    return (
        <div className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-rp-overlay/50 bg-rp-base/80 px-4 backdrop-blur-md transition-all">
            {/* Left: Persona Info & Back */}
            <div className="flex items-center gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-rp-subtle hover:bg-rp-overlay hover:text-rp-text transition-colors"
                    >
                        <IconArrowLeft size={20} />
                    </button>
                )}

                {/* Avatar with Status Ring */}
                {personaImage ? (
                    <div className="relative group cursor-pointer" onClick={() => setIsCharacterPanelOpen(true)}>
                        <div className="relative size-10 overflow-hidden rounded-full ring-2 ring-rp-highlight-med transition-all group-hover:ring-rp-iris">
                            <Image
                                src={personaImage}
                                alt={personaName || "Persona"}
                                fill
                                className="object-cover"
                            />
                        </div>
                        {/* Live/Online Indicator */}
                        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-rp-base p-0.5">
                            <div className="size-full rounded-full bg-rp-love border border-rp-base shadow-sm" />
                        </span>
                    </div>
                ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-rp-overlay ring-2 ring-rp-highlight-med">
                        <IconUser size={20} className="text-rp-subtle" />
                    </div>
                )}

                {/* Name & Status */}
                <div className="flex flex-col cursor-pointer" onClick={() => setIsCharacterPanelOpen(true)}>
                    {personaName && (
                        <div className="font-tiempos-headline text-lg font-bold text-rp-text leading-tight group-hover:text-rp-iris transition-colors">
                            {personaName}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-rp-love flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rp-love opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rp-love"></span>
                            </span>
                            Live
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
                {/* Background Toggle */}
                <button
                    onClick={() => setChatBackgroundEnabled(!chatBackgroundEnabled)}
                    className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                        chatBackgroundEnabled
                            ? "bg-rp-iris/20 text-rp-iris ring-1 ring-rp-iris/50"
                            : "text-rp-subtle hover:bg-rp-overlay hover:text-rp-text"
                    )}
                    title={chatBackgroundEnabled ? "Hide Background" : "Show Background"}
                >
                    <IconPhoto size={20} />
                </button>

                {/* Settings / More */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-rp-subtle hover:bg-rp-overlay hover:text-rp-text transition-colors">
                            <IconDotsVertical size={20} />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-rp-surface border-rp-highlight-low">
                        <DropdownMenuItem
                            className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer"
                            onClick={() => setIsCharacterPanelOpen(true)}
                        >
                            View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer">
                            Chat Settings
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
