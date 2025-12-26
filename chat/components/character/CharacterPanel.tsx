"use client"

import { RemrinContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    IconChevronRight,
    IconHeart,
    IconHeartFilled,
    IconMessage,
    IconSettings,
    IconUser,
    IconX
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import Image from "next/image"

interface CharacterPanelProps {
    width?: number
    onClose?: () => void
}

export const CharacterPanel: FC<CharacterPanelProps> = ({
    width = 350,
    onClose
}) => {
    const { selectedPersona, setIsCharacterPanelOpen, isCharacterPanelOpen } = useContext(RemrinContext)
    const [activeTab, setActiveTab] = useState<"chat" | "persona" | "settings">("chat")
    const [isFollowing, setIsFollowing] = useState(false)

    const handleClose = () => {
        if (onClose) {
            onClose()
        } else {
            setIsCharacterPanelOpen(false)
        }
    }

    const handleOpen = () => {
        setIsCharacterPanelOpen(true)
    }

    // Always show the toggle chevron, even when panel is closed
    if (!selectedPersona) {
        return null
    }

    // Show only the toggle button when panel is closed
    if (!isCharacterPanelOpen) {
        return (
            <button
                onClick={handleOpen}
                className="bg-rp-overlay border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text absolute right-0 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-l-full border border-r-0 transition-colors"
                title="Open character panel"
            >
                <IconChevronRight size={16} className="rotate-180" />
            </button>
        )
    }

    return (
        <div
            className="border-border/50 bg-rp-surface relative flex h-full shrink-0 flex-col border-l"
            style={{ width: `${width}px` }}
        >
            {/* Collapse chevron on left edge */}
            <button
                onClick={handleClose}
                className="bg-rp-overlay border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text absolute -left-4 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border transition-colors"
                title="Collapse panel"
            >
                <IconChevronRight size={16} />
            </button>

            {/* Hero Image Section */}
            <div className="relative h-72 w-full overflow-hidden">
                {selectedPersona.image_url ? (
                    <Image
                        src={selectedPersona.image_url}
                        alt={selectedPersona.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="from-rp-iris/20 to-rp-rose/20 flex size-full items-center justify-center bg-gradient-to-br">
                        <IconUser size={64} className="text-rp-muted" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="from-rp-base absolute inset-0 bg-gradient-to-t via-transparent to-transparent" />

                {/* Live indicator (optional) */}
                <div className="bg-rp-foam/90 text-rp-base absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium">
                    <span className="bg-rp-base size-1.5 animate-pulse rounded-full" />
                    Live
                </div>

                {/* Follow Button - Top Left */}
                <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={cn(
                        "absolute left-3 top-3 flex size-9 items-center justify-center rounded-full backdrop-blur-sm transition-all",
                        isFollowing
                            ? "bg-rp-rose/30 text-rp-rose"
                            : "bg-rp-base/60 text-rp-text hover:bg-rp-rose/20 hover:text-rp-rose"
                    )}
                    title={isFollowing ? "Following" : "Follow"}
                >
                    {isFollowing ? (
                        <IconHeartFilled size={18} />
                    ) : (
                        <IconHeart size={18} />
                    )}
                </button>
            </div>

            {/* Character Info */}
            <div className="relative -mt-12 px-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="font-tiempos-headline text-rp-text text-xl font-bold">
                            {selectedPersona.name}
                        </h2>
                        <p className="text-rp-subtle mt-0.5 text-sm">
                            by @{(selectedPersona as any).creator_username || "remrin"}
                        </p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="text-rp-subtle mt-3 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                        <IconMessage size={14} />
                        {((selectedPersona as any).total_chats || 0).toLocaleString()} chats
                    </span>
                    <span className="flex items-center gap-1">
                        <IconHeartFilled size={14} className="text-rp-rose" />
                        {((selectedPersona as any).followers_count || 0).toLocaleString()} followers
                    </span>
                </div>

                {/* Category Tags */}
                {selectedPersona.category && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="bg-rp-iris/20 text-rp-iris rounded-full px-2.5 py-0.5 text-xs font-medium">
                            {selectedPersona.category}
                        </span>
                        {selectedPersona.tags?.slice(0, 3).map((tag: string) => (
                            <span
                                key={tag}
                                className="bg-rp-base text-rp-subtle rounded-full px-2.5 py-0.5 text-xs"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-border/50 mt-4 flex border-b">
                {[
                    { id: "chat", icon: IconMessage, label: "Chat" },
                    { id: "persona", icon: IconUser, label: "Persona" },
                    { id: "settings", icon: IconSettings, label: "Settings" }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "border-rp-iris text-rp-text border-b-2"
                                : "text-rp-subtle hover:text-rp-text"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
                {activeTab === "chat" && (
                    <div className="space-y-4">
                        <h3 className="font-tiempos-headline text-rp-text font-medium">Comments</h3>
                        <div className="bg-rp-base/50 rounded-lg p-3">
                            <input
                                type="text"
                                placeholder="Type your comment about this Talkie..."
                                className="text-rp-text placeholder:text-rp-muted w-full bg-transparent text-sm focus:outline-none"
                            />
                        </div>
                        <p className="text-rp-muted text-center text-sm">
                            No comments yet
                        </p>
                    </div>
                )}

                {activeTab === "persona" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-tiempos-headline text-rp-text mb-2 font-medium">About</h3>
                            <p className="text-rp-subtle text-sm leading-relaxed">
                                {selectedPersona.description || "No description available."}
                            </p>
                        </div>
                        {selectedPersona.intro_message && (
                            <div>
                                <h3 className="font-tiempos-headline text-rp-text mb-2 font-medium">Intro Message</h3>
                                <p className="text-rp-subtle text-sm leading-relaxed">
                                    &ldquo;{selectedPersona.intro_message}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="space-y-4">
                        <h3 className="font-tiempos-headline text-rp-text font-medium">Chat Settings</h3>
                        <p className="text-rp-subtle text-sm">
                            Settings for this chat session will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CharacterPanel
