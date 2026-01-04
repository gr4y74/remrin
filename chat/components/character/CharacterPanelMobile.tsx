"use client"

import { RemrinContext } from "@/context/context"
import { cn } from "@/lib/utils"
import {
    IconChevronRight,
    IconHeart,
    IconHeartFilled,
    IconMessage,
    IconSettings,
    IconUser,
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import Image from "next/image"
import { Drawer } from "vaul"

export const CharacterPanelMobile: FC = () => {
    const { selectedPersona, isCharacterPanelOpen, setIsCharacterPanelOpen } = useContext(RemrinContext)
    const [activeTab, setActiveTab] = useState<"chat" | "persona" | "settings">("chat")
    const [isFollowing, setIsFollowing] = useState(false)

    if (!selectedPersona) {
        return null
    }

    return (
        <Drawer.Root open={isCharacterPanelOpen} onOpenChange={setIsCharacterPanelOpen}>
            <Drawer.Trigger asChild>
                <button
                    className="bg-rp-overlay border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text fixed bottom-20 right-4 z-20 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-full border shadow-lg transition-colors md:hidden"
                    title="Open character panel"
                >
                    <IconChevronRight size={20} className="rotate-180" />
                </button>
            </Drawer.Trigger>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
                <Drawer.Content className="bg-rp-surface fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl">
                    {/* Drawer Handle */}
                    <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-rp-muted/30" />

                    {/* Hero Image Section */}
                    <div className="relative h-64 w-full shrink-0 overflow-hidden">
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

                        {/* Live indicator */}
                        <div className="bg-rp-foam/90 text-rp-base absolute right-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium">
                            <span className="bg-rp-base size-1.5 animate-pulse rounded-full" />
                            Live
                        </div>

                        {/* Follow Button - Top Left */}
                        <button
                            onClick={() => setIsFollowing(!isFollowing)}
                            className={cn(
                                "absolute left-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full backdrop-blur-sm transition-all",
                                isFollowing
                                    ? "bg-rp-rose/30 text-rp-rose"
                                    : "bg-rp-base/60 text-rp-text hover:bg-rp-rose/20 hover:text-rp-rose"
                            )}
                            title={isFollowing ? "Following" : "Follow"}
                        >
                            {isFollowing ? (
                                <IconHeartFilled size={20} />
                            ) : (
                                <IconHeart size={20} />
                            )}
                        </button>
                    </div>

                    {/* Character Info */}
                    <div className="relative -mt-8 px-4">
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
                                <IconMessage size={16} />
                                {((selectedPersona as any).total_chats || 0).toLocaleString()} chats
                            </span>
                            <span className="flex items-center gap-1">
                                <IconHeartFilled size={16} className="text-rp-rose" />
                                {((selectedPersona as any).followers_count || 0).toLocaleString()} followers
                            </span>
                        </div>

                        {/* Category Tags */}
                        {selectedPersona.category && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="bg-rp-iris/20 text-rp-iris rounded-full px-3 py-1 text-xs font-medium">
                                    {selectedPersona.category}
                                </span>
                                {selectedPersona.tags?.slice(0, 3).map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="bg-rp-base text-rp-subtle rounded-full px-3 py-1 text-xs"
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
                                    "flex min-h-[44px] flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                                    activeTab === tab.id
                                        ? "border-rp-iris text-rp-text border-b-2"
                                        : "text-rp-subtle hover:text-rp-text"
                                )}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content - Scrollable */}
                    <div className="flex-1 overflow-auto p-4">
                        {activeTab === "chat" && (
                            <div className="space-y-4">
                                <h3 className="font-tiempos-headline text-rp-text font-medium">Comments</h3>
                                <div className="bg-rp-base/50 rounded-lg p-4">
                                    <input
                                        type="text"
                                        placeholder="Type your comment about this Talkie..."
                                        className="text-rp-text placeholder:text-rp-muted min-h-[44px] w-full bg-transparent text-sm focus:outline-none"
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
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    )
}

export default CharacterPanelMobile
