import React, { FC, useContext, useRef } from "react"
import { IconPhoto, IconDotsVertical, IconArrowLeft, IconUser } from "@tabler/icons-react"
import { RemrinContext } from "@/context/context"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { uploadChatBackground, getChatBackgroundFromStorage } from "@/db/storage/chat-backgrounds"
import { toast } from "sonner"

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
    const {
        chatBackgroundEnabled,
        setChatBackgroundEnabled,
        setActiveBackgroundUrl,
        setIsCharacterPanelOpen,
        profile
    } = useContext(RemrinContext)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0] || !profile) return
        const file = e.target.files[0]

        const loadingToast = toast.loading("Uploading background...")

        try {
            const path = `${profile.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
            const uploadedPath = await uploadChatBackground(path, file)
            const url = await getChatBackgroundFromStorage(uploadedPath)

            setActiveBackgroundUrl(url)
            setChatBackgroundEnabled(true)

            toast.success("Background updated!", { id: loadingToast })
        } catch (error: any) {
            console.error("Upload error:", error)
            toast.error(error.message || "Failed to upload background", { id: loadingToast })
        }
    }

    return (
        <div className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-rp-overlay/50 bg-rp-base/80 px-4 backdrop-blur-md transition-all">
            {/* Left: Persona Info & Back */}
            <div className="flex items-center gap-3">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="mr-1 flex h-8 w-8 items-center justify-center rounded-full text-white hover:bg-rp-overlay hover:text-white/80 transition-colors"

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
                        <IconUser size={20} className="text-white" />
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
                            : "text-white hover:bg-rp-overlay hover:text-white/80"
                    )}
                    title={chatBackgroundEnabled ? "Hide Background" : "Show Background"}

                >
                    <IconPhoto size={20} />
                </button>

                {/* Hidden File Input for Backgrounds */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleBackgroundUpload}
                />

                {/* Settings / More */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-white hover:bg-rp-overlay hover:text-white/80 transition-colors">
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
                        <DropdownMenuSeparator className="bg-rp-highlight-low/20" />
                        <DropdownMenuItem
                            className="text-rp-text focus:bg-rp-overlay focus:text-rp-text cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Change Background
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
