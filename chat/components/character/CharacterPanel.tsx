"use client"

import { RemrinContext } from "@/context/context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    IconChevronUp,
    IconChevronRight,
    IconDots,
    IconHeart,
    IconHeartFilled,
    IconMessage,
    IconSettings,
    IconUser,
    IconUsers,
    IconPaperclip,
    IconPhoto,
    IconArrowNarrowRight
} from "@tabler/icons-react"
import { FC, useContext, useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { TYPOGRAPHY } from "@/lib/design-system"

interface CharacterPanelProps {
    width?: number
    onClose?: () => void
}

type TabId = "comments" | "similar" | "settings"

const TABS: { id: TabId; icon: typeof IconMessage; label: string }[] = [
    { id: "comments", icon: IconMessage, label: "Comments" },
    { id: "similar", icon: IconUser, label: "Similar" },
    { id: "settings", icon: IconSettings, label: "Settings" }
]

export const CharacterPanel: FC<CharacterPanelProps> = ({
    width = 350,
    onClose
}) => {
    const { selectedPersona, setIsCharacterPanelOpen, isCharacterPanelOpen, profile } = useContext(RemrinContext)
    const [activeTab, setActiveTab] = useState<TabId>("comments")
    const [isFollowing, setIsFollowing] = useState(false)
    const [commentText, setCommentText] = useState("")

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

    // Get active tab index for sliding indicator
    const activeTabIndex = useMemo(() => {
        return TABS.findIndex(tab => tab.id === activeTab)
    }, [activeTab])

    // Always show the toggle chevron, even when panel is closed
    if (!selectedPersona) {
        return null
    }

    // Show only the toggle button when panel is closed
    if (!isCharacterPanelOpen) {
        return (
            <button
                onClick={handleOpen}
                className="bg-rp-overlay border-border/50 text-rp-subtle hover:bg-rp-highlight-med hover:text-rp-text absolute right-0 top-1/2 z-20 hidden min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-l-full border border-r-0 transition-colors md:flex"
                aria-label="Open character panel"
                title="Open character panel"
            >
                <IconChevronRight size={18} className="rotate-180" />
            </button>
        )
    }

    // Get persona stats
    const totalChats = ((selectedPersona as any).total_chats || 0).toLocaleString()
    const followers = ((selectedPersona as any).followers_count || 0).toLocaleString()
    const creatorUsername = (selectedPersona as any).creator_username || "remrin"
    const creatorId = (selectedPersona as any).creator_id || null

    return (
        <div
            className="border-rp-highlight-low bg-rp-surface fixed right-0 top-0 z-30 flex h-screen flex-col border-l"
            style={{ width: `${width}px` }}
        >
            {/* Full-Bleed Hero Image Section - Talkie Style */}
            <div className="relative flex-1 min-h-[45%] max-h-[55%] w-full overflow-hidden">
                <Image
                    src={selectedPersona.image_url || "/images/rem_hero.webp"}
                    alt={selectedPersona.name}
                    fill
                    className="object-cover"
                    priority
                />

                {/* Gradient overlay at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-rp-surface via-transparent to-transparent" />

                {/* More options button (top-right) */}
                <button
                    className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-rp-base/60 backdrop-blur-sm hover:bg-rp-overlay transition-colors"
                    aria-label="More options"
                >
                    <IconDots size={18} className="text-rp-subtle" />
                </button>

                {/* Collapse handle - Talkie style (centered at bottom) */}
                <button
                    onClick={handleClose}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center p-2 rounded-full bg-rp-base/60 backdrop-blur-sm hover:bg-rp-overlay transition-all"
                    aria-label="Collapse panel"
                >
                    <IconChevronUp size={18} className="text-rp-subtle" />
                </button>
            </div>

            {/* Character Info Section - Talkie Style */}
            <div className="px-4 py-3 bg-rp-surface">
                {/* Avatar + Name Row */}
                <div className="flex items-center gap-3">
                    {/* Character Avatar */}
                    <div className="relative shrink-0">
                        <img
                            src={selectedPersona.image_url || "/images/rem_hero.webp"}
                            alt={selectedPersona.name}
                            className="size-12 rounded-full object-cover ring-2 ring-rp-highlight-med"
                        />
                    </div>

                    {/* Name with profile link */}
                    <Link
                        href={`/character/${selectedPersona.id}`}
                        className="flex items-center gap-1 group"
                    >
                        <span className="font-tiempos-headline text-lg font-semibold text-rp-text group-hover:text-rp-iris transition-colors">
                            {selectedPersona.name}
                        </span>
                        <IconArrowNarrowRight size={18} className="text-rp-subtle group-hover:text-rp-iris transition-colors" />
                    </Link>
                </div>

                {/* Stats Row with Dividers - Talkie Style */}
                <div className="flex items-center gap-2 mt-2 text-sm text-rp-subtle">
                    {/* Chat count */}
                    <span className="flex items-center gap-1">
                        <IconMessage size={14} />
                        <span>{totalChats}</span>
                    </span>

                    {/* Divider */}
                    <span className="h-3 w-px bg-rp-muted/40" />

                    {/* Followers */}
                    <span className="flex items-center gap-1">
                        <IconUsers size={14} />
                        <span>{followers}</span>
                    </span>

                    {/* Divider */}
                    <span className="h-3 w-px bg-rp-muted/40" />

                    {/* Creator link */}
                    <Link
                        href={creatorId ? `/profile/${creatorId}` : "#"}
                        className="flex items-center gap-1 hover:text-rp-text transition-colors"
                    >
                        <span>By @{creatorUsername}</span>
                        <div className="size-4 rounded-full bg-rp-iris/30 flex items-center justify-center">
                            <IconUser size={10} className="text-rp-iris" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Icon-Only Tabs with Sliding Indicator - Talkie Style */}
            <div className="relative flex border-b border-rp-highlight-low bg-rp-surface">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-3 flex items-center justify-center min-h-[44px] transition-colors",
                            activeTab === tab.id ? "text-rp-text" : "text-rp-subtle hover:text-rp-text"
                        )}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-label={tab.label}
                    >
                        <tab.icon size={22} />
                    </button>
                ))}

                {/* Animated active line indicator */}
                <div
                    className="absolute bottom-0 h-0.5 bg-rp-iris transition-all duration-300 ease-out"
                    style={{
                        left: `${activeTabIndex * (100 / TABS.length)}%`,
                        width: `${100 / TABS.length}%`
                    }}
                />
            </div>

            {/* Split Line */}
            <div className="border-t border-rp-highlight-low" />

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-auto">
                {/* Comments Tab */}
                {activeTab === "comments" && (
                    <div className="p-4">
                        {/* Comments Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-medium text-rp-text">Comments</span>
                            <span className="text-rp-subtle text-sm">0</span>
                        </div>

                        {/* Comment Input Area - Talkie Style */}
                        <div className="bg-rp-base/50 rounded-xl border border-rp-highlight-low">
                            <div className="flex items-start gap-3 p-3">
                                {/* User Avatar */}
                                {profile?.image_url ? (
                                    <img
                                        src={profile.image_url}
                                        alt="You"
                                        className="size-8 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="size-8 rounded-full bg-rp-iris/20 flex items-center justify-center shrink-0">
                                        <IconUser size={16} className="text-rp-iris" />
                                    </div>
                                )}

                                {/* Text Input */}
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Type your comment about this Talkie..."
                                    className="flex-1 bg-transparent resize-none text-sm text-rp-text placeholder:text-rp-muted focus:outline-none min-h-[22px]"
                                    rows={1}
                                />
                            </div>

                            {/* Input Actions Row */}
                            <div className="flex items-center justify-between px-3 pb-3">
                                {/* Left: Media buttons */}
                                <div className="flex gap-1">
                                    <button className="p-2 hover:bg-rp-overlay rounded-lg transition-colors">
                                        <IconPaperclip size={18} className="text-rp-subtle" />
                                    </button>
                                    <button className="p-2 hover:bg-rp-overlay rounded-lg transition-colors">
                                        <IconPhoto size={18} className="text-rp-subtle" />
                                    </button>
                                </div>

                                {/* Right: Cancel/Post buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setCommentText("")}
                                        className="text-rp-subtle"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={!commentText.trim()}
                                        className="bg-rp-iris hover:bg-rp-iris/80"
                                    >
                                        Post
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Empty State */}
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-rp-overlay mb-3">
                                <IconMessage size={28} className="text-rp-muted" />
                            </div>
                            <p className="text-rp-muted text-sm">No comments yet.</p>
                        </div>
                    </div>
                )}

                {/* Similar Characters Tab */}
                {activeTab === "similar" && (
                    <div className="p-4">
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center size-16 rounded-full bg-rp-overlay mb-3">
                                <IconUsers size={28} className="text-rp-muted" />
                            </div>
                            <p className="text-rp-muted text-sm">Similar characters will appear here.</p>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <div className="p-4 space-y-4">
                        <h3 className={`${TYPOGRAPHY.heading.h4} text-rp-text`}>Chat Settings</h3>
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
