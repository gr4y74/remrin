"use client"

import { ChatbotUIContext } from "@/context/context"
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

interface CharacterPanelProps {
    width?: number
    onClose?: () => void
}

export const CharacterPanel: FC<CharacterPanelProps> = ({
    width = 350,
    onClose
}) => {
    const { selectedPersona, setIsCharacterPanelOpen, isCharacterPanelOpen } = useContext(ChatbotUIContext)
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
                className="absolute right-0 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-l-full bg-rp-overlay border border-r-0 border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text transition-colors"
                title="Open character panel"
            >
                <IconChevronRight size={16} className="rotate-180" />
            </button>
        )
    }

    return (
        <div
            className="relative flex h-full shrink-0 flex-col border-l border-border/50 bg-rp-surface"
            style={{ width: `${width}px` }}
        >
            {/* Collapse chevron on left edge */}
            <button
                onClick={handleClose}
                className="absolute -left-4 top-1/2 z-20 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-rp-overlay border border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text transition-colors"
                title="Collapse panel"
            >
                <IconChevronRight size={16} />
            </button>

            {/* Hero Image Section */}
            <div className="relative h-72 w-full overflow-hidden">
                {selectedPersona.image_url ? (
                    <img
                        src={selectedPersona.image_url}
                        alt={selectedPersona.name}
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-light-purple/20 to-ram-pink/20">
                        <IconUser size={64} className="text-muted-foreground" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-darker-dark-blue via-transparent to-transparent" />

                {/* Live indicator (optional) */}
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-green-500/90 px-2 py-0.5 text-xs font-medium text-white">
                    <span className="size-1.5 animate-pulse rounded-full bg-white" />
                    Live
                </div>
            </div>

            {/* Character Info */}
            <div className="relative -mt-12 px-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {selectedPersona.name}
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            by @{(selectedPersona as any).creator_username || "remrin"}
                        </p>
                    </div>
                    {/* Follow Button */}
                    <Button
                        variant={isFollowing ? "secondary" : "default"}
                        size="sm"
                        onClick={() => setIsFollowing(!isFollowing)}
                        className={cn(
                            "gap-1.5",
                            isFollowing && "bg-ram-pink/20 hover:bg-ram-pink/30"
                        )}
                    >
                        {isFollowing ? (
                            <IconHeartFilled size={16} className="text-ram-pink" />
                        ) : (
                            <IconHeart size={16} />
                        )}
                        {isFollowing ? "Following" : "Follow"}
                    </Button>
                </div>

                {/* Stats Row */}
                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <IconMessage size={14} />
                        {((selectedPersona as any).total_chats || 0).toLocaleString()} chats
                    </span>
                    <span className="flex items-center gap-1">
                        <IconHeartFilled size={14} className="text-ram-pink" />
                        {((selectedPersona as any).followers_count || 0).toLocaleString()} followers
                    </span>
                </div>

                {/* Category Tags */}
                {selectedPersona.category && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-light-purple/20 px-2.5 py-0.5 text-xs font-medium text-light-purple">
                            {selectedPersona.category}
                        </span>
                        {selectedPersona.tags?.slice(0, 3).map((tag: string) => (
                            <span
                                key={tag}
                                className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="mt-4 flex border-b border-border/50">
                {[
                    { id: "chat", icon: IconMessage, label: "Chat" },
                    { id: "persona", icon: IconUser, label: "Persona" },
                    { id: "settings", icon: IconSettings, label: "Settings" }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            "flex flex-1 items-center justify-center gap-1.5 py-3 text-sm transition-colors",
                            activeTab === tab.id
                                ? "border-b-2 border-rem-blue text-foreground"
                                : "text-muted-foreground hover:text-foreground"
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
                        <h3 className="font-medium text-foreground">Comments</h3>
                        <div className="rounded-lg bg-muted/50 p-3">
                            <input
                                type="text"
                                placeholder="Type your comment about this Talkie..."
                                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                            />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            No comments yet
                        </p>
                    </div>
                )}

                {activeTab === "persona" && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-2 font-medium text-foreground">About</h3>
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {selectedPersona.description || "No description available."}
                            </p>
                        </div>
                        {selectedPersona.intro_message && (
                            <div>
                                <h3 className="mb-2 font-medium text-foreground">Intro Message</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    &ldquo;{selectedPersona.intro_message}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="space-y-4">
                        <h3 className="font-medium text-foreground">Chat Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Settings for this chat session will appear here.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CharacterPanel
