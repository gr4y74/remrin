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
    IconArrowNarrowRight,
    IconSparkles,
    IconWaveSine
} from "@tabler/icons-react"
import { FC, useContext, useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { TYPOGRAPHY } from "@/lib/design-system"
import { MOTHER_OF_SOULS_ID } from "@/lib/forge/is-mother-chat"
import { useParams } from "next/navigation"
import { useEffect as useReactEffect } from "react"
import { toast } from "sonner"
import { getIsFollowing, followPersona, unfollowPersona } from "@/db/character-follows"
import { getCommentsByPersonaId, postComment } from "@/db/comments"
import { getSimilarPersonas } from "@/db/discovery"
import { updatePersonaImageActions } from "@/app/actions/update-persona-image"


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
    const params = useParams()
    const locale = params.locale as string

    const [activeTab, setActiveTab] = useState<TabId>("comments")
    const [isFollowing, setIsFollowing] = useState(false)
    const [isFollowLoading, setIsFollowLoading] = useState(false)
    const [commentText, setCommentText] = useState("")
    const [comments, setComments] = useState<any[]>([])
    const [isLoadingComments, setIsLoadingComments] = useState(false)
    const [similarPersonas, setSimilarPersonas] = useState<any[]>([])
    const [isLoadingSimilar, setIsLoadingSimilar] = useState(false)
    const [commentCount, setCommentCount] = useState(0)
    const [isSparking, setIsSparking] = useState(false)


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

    // Fetch initial data
    useReactEffect(() => {
        if (!selectedPersona || !isCharacterPanelOpen) return

        const fetchData = async () => {
            // Check follow status
            if (profile && profile.user_id) {
                const following = await getIsFollowing(profile.user_id, selectedPersona.id)
                setIsFollowing(following)
            }


            // Fetch comments
            setIsLoadingComments(true)
            const personaComments = await getCommentsByPersonaId(selectedPersona.id)
            setComments(personaComments)
            setCommentCount(personaComments.length)
            setIsLoadingComments(false)

            // Fetch similar personas
            setIsLoadingSimilar(true)
            const similar = await getSimilarPersonas(selectedPersona.id)
            setSimilarPersonas(similar)
            setIsLoadingSimilar(false)
        }

        fetchData()
    }, [selectedPersona?.id, isCharacterPanelOpen, profile?.id])

    const handleFollowClick = async () => {
        if (!profile || !selectedPersona) {
            toast.error("Please log in to follow characters")
            return
        }

        if (!profile.user_id) return

        setIsFollowLoading(true)
        try {
            if (isFollowing) {
                await unfollowPersona(profile.user_id, selectedPersona.id)
                setIsFollowing(false)
                toast.success(`Unfollowed ${selectedPersona.name}`)
            } else {
                await followPersona(profile.user_id, selectedPersona.id)
                setIsFollowing(true)
                toast.success(`Following ${selectedPersona.name}!`)
            }
        } catch (error: any) {

            toast.error(error.message || "Failed to update follow status")
        } finally {
            setIsFollowLoading(false)
        }
    }

    const handlePostComment = async () => {
        if (!profile || !profile.user_id || !selectedPersona || !commentText.trim()) return

        const loadingToast = toast.loading("Posting comment...")
        try {
            const newComment = await postComment(
                profile.user_id,
                selectedPersona.id,
                commentText.trim()
            )

            // Refetch comments to show the new one with user profile
            const personaComments = await getCommentsByPersonaId(selectedPersona.id)

            setComments(personaComments)
            setCommentCount(personaComments.length)
            setCommentText("")
            toast.success("Comment posted!", { id: loadingToast })
        } catch (error: any) {
            toast.error(error.message || "Failed to post comment", { id: loadingToast })
        }
    }


    const handleSparkOfLife = async () => {
        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !profile) {
            // Actually we check profile in generic way
        }
        if (!profile || !selectedPersona) return;

        if (!confirm(`Ignite the Spark of Life for 50 Aether?\n\nThis will generate a living video portrait for ${selectedPersona.name}.`)) return;

        setIsSparking(true)
        const toastId = toast.loading("Igniting Spark of Life...")

        try {
            // 1. Create Prediction
            const response = await fetch("/api/spark/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    persona_id: selectedPersona.id,
                    image_url: selectedPersona.image_url
                })
            })

            const data = await response.json()

            if (!response.ok) throw new Error(data.error || "Failed to start generation")

            toast.message("Spark ignited! Breathing life into soul...", {
                description: "This may take several minutes, please be patient.",
                id: toastId,
                duration: 10000 // Show for longer
            })

            // 2. Poll for Status
            const predictionId = data.predictionId

            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/spark/status?id=${predictionId}&personaId=${selectedPersona.id}`)
                    const statusData = await statusRes.json()

                    if (statusData.status === "succeeded") {
                        clearInterval(pollInterval)
                        setIsSparking(false)
                        toast.success("It is alive! refresh to see changes.", { id: toastId })
                        // Soft reload or update context would be better, but force refresh works 
                        window.location.reload()
                    } else if (statusData.status === "failed") {
                        clearInterval(pollInterval)
                        setIsSparking(false)
                        toast.error("The spark faded. Please try again.", { id: toastId })
                    }
                } catch (e) {
                    console.error("Polling error", e)
                }
            }, 3000)

        } catch (error: any) {
            setIsSparking(false)
            toast.error(error.message, { id: toastId })
        }
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
    const isOwner = profile?.user_id === (selectedPersona as any).owner_id

    return (
        <div
            className="bg-rp-surface fixed right-0 top-0 z-30 flex h-screen flex-col"
            style={{ width: `${width}px` }}
        >
            {/* Full-Bleed Hero Image Section - Talkie Style */}
            <div className="relative flex-1 min-h-[45%] max-h-[55%] w-full overflow-hidden">
                {selectedPersona.id === MOTHER_OF_SOULS_ID || (selectedPersona as any).video_url ? (
                    <video
                        src={selectedPersona.id === MOTHER_OF_SOULS_ID ? "/images/mother/mos_hero.mp4" : (selectedPersona as any).video_url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <Image
                        src={selectedPersona.image_url || "/images/rem_hero.webp"}
                        alt={selectedPersona.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 350px"
                        className="object-cover"
                        priority
                    />
                )}

                {/* Gradient overlay at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-rp-surface via-transparent to-transparent" />
                <div className="absolute right-3 top-3 flex items-center gap-2">

                </div>
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
                        <div className="relative size-12 shadow-sm">
                            <Image
                                src={selectedPersona.image_url || "/images/rem_hero.webp"}
                                alt={selectedPersona.name}
                                className="rounded-full object-cover"
                                fill
                                sizes="48px"
                            />
                        </div>
                    </div>

                    {/* Name with profile link */}
                    <Link
                        href={`/${locale}/character/${selectedPersona.id}`}
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
                        href={creatorId ? `/${locale}/profile/${creatorId}` : "#"}
                        className="flex items-center gap-1 hover:text-rp-text transition-colors"
                    >
                        <span>By @{creatorUsername}</span>
                        <div className="size-4 rounded-full bg-rp-iris/30 flex items-center justify-center">
                            <IconUser size={10} className="text-rp-iris" />
                        </div>
                    </Link>
                </div>


                {/* Follow Button */}
                <button
                    onClick={handleFollowClick}
                    disabled={isFollowLoading}
                    className={cn(
                        "mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all",
                        isFollowing
                            ? "bg-rp-love/20 text-rp-love hover:bg-rp-love/30"
                            : "bg-rp-overlay/40 text-rp-text hover:bg-rp-overlay",
                        isFollowLoading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isFollowing ? (
                        <>
                            <IconHeartFilled size={18} />
                            <span>Following</span>
                        </>
                    ) : (
                        <>
                            <IconHeart size={18} />
                            <span>Follow</span>
                        </>
                    )}
                </button>

            </div>

            {/* Icon-Only Tabs with Sliding Indicator - Talkie Style */}
            <div className="relative flex bg-rp-surface">
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

            {/* Split Line - Removed for seamless design */}

            {/* Tab Content - Scrollable */}
            <div className="flex-1 overflow-auto">
                {/* Comments Tab */}
                {activeTab === "comments" && (
                    <div className="p-4">
                        {/* Comments Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="font-medium text-rp-text">Comments</span>
                            <span className="text-rp-subtle text-sm">{commentCount}</span>
                        </div>


                        {/* Comment Input Area - Talkie Style */}
                        <div className="bg-rp-base/50 rounded-xl">
                            <div className="flex items-start gap-3 p-3">
                                {/* User Avatar */}
                                {profile?.image_url ? (
                                    <div className="relative size-8 shrink-0">
                                        <Image
                                            src={profile.image_url}
                                            alt="You"
                                            className="rounded-full object-cover"
                                            fill
                                            sizes="32px"
                                        />
                                    </div>
                                ) : (
                                    <div className="size-8 rounded-full bg-rp-iris/20 flex items-center justify-center shrink-0">
                                        <IconUser size={16} className="text-rp-iris" />
                                    </div>
                                )}

                                {/* Text Input */}
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Type your comment about this soul..."
                                    className="flex-1 bg-transparent resize-none text-sm text-rp-text placeholder:text-rp-muted focus:outline-none min-h-[22px]"
                                    rows={1}
                                />
                            </div>

                            {/* Input Actions Row */}
                            <div className="flex items-center justify-between px-3 pb-3">
                                {/* Left: Media buttons */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => toast.info("File sharing coming soon!")}
                                        className="p-2 hover:bg-rp-overlay rounded-lg transition-colors"
                                    >
                                        <IconPaperclip size={18} className="text-rp-subtle" />
                                    </button>
                                    <button
                                        onClick={() => toast.info("Image sharing coming soon!")}
                                        className="p-2 hover:bg-rp-overlay rounded-lg transition-colors"
                                    >
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
                                        onClick={handlePostComment}
                                    >
                                        Post
                                    </Button>
                                </div>

                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="mt-6 space-y-4">
                            {isLoadingComments ? (
                                <div className="flex justify-center py-4">
                                    <div className="size-6 border-2 border-rp-iris border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="relative size-8 shrink-0">
                                            {comment.profiles?.image_url ? (
                                                <Image
                                                    src={comment.profiles.image_url}
                                                    alt={comment.profiles.username}
                                                    fill
                                                    sizes="32px"
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="size-8 rounded-full bg-rp-overlay flex items-center justify-center">
                                                    <IconUser size={16} className="text-rp-subtle" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold text-rp-text">
                                                    {comment.profiles?.display_name || comment.profiles?.username || "Researcher"}
                                                </span>
                                                <span className="text-[10px] text-rp-muted">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-rp-subtle bg-rp-overlay/30 p-2 rounded-lg rounded-tl-none">
                                                {comment.comment_text}
                                            </p>
                                        </div>
                                    </div>

                                ))
                            ) : (
                                /* Empty State */
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center size-12 rounded-full bg-rp-overlay mb-3">
                                        <IconMessage size={20} className="text-rp-muted" />
                                    </div>
                                    <p className="text-rp-muted text-xs">No comments yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* Similar Characters Tab */}
                {activeTab === "similar" && (
                    <div className="p-4">
                        {isLoadingSimilar ? (
                            <div className="flex justify-center py-12">
                                <div className="size-8 border-2 border-rp-iris border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : similarPersonas.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {similarPersonas.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/${locale}/chat/${p.id}`}
                                        className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-rp-overlay transition-all hover:ring-2 hover:ring-rp-iris shadow-lg"
                                    >
                                        <Image
                                            src={p.image_url || "/images/rem_hero.webp"}
                                            alt={p.name}
                                            fill
                                            sizes="150px"
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <div className="text-[10px] font-bold text-white truncate">{p.name}</div>
                                            <div className="text-[8px] text-white/70 truncate">{p.category || "Soul"}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center size-16 rounded-full bg-rp-overlay mb-3">
                                    <IconUsers size={28} className="text-rp-muted" />
                                </div>
                                <p className="text-rp-muted text-sm">Similar characters will appear here.</p>
                            </div>
                        )}
                    </div>
                )}


                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <div className="p-4 space-y-4">
                        <h3 className={`${TYPOGRAPHY.heading.h4} text-rp-text mb-4`}>Chat Settings</h3>

                        {/* Settings Buttons */}
                        <div className="space-y-3">
                            {/* Spark of Life - ONLY FOR OWNER AND IF NO VIDEO */}
                            {isOwner && !(selectedPersona as any).video_url && (
                                <button
                                    onClick={handleSparkOfLife}
                                    disabled={isSparking}
                                    className="w-full relative overflow-hidden flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-rp-rose/20 to-rp-iris/20 border border-rp-rose/20 hover:border-rp-iris/50 transition-all group"
                                >
                                    <div className="flex items-center justify-center size-10 rounded-lg bg-rp-rose/20 shadow-inner">
                                        <IconSparkles size={20} className={isSparking ? "text-rp-rose animate-spin" : "text-rp-rose"} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-rp-rose to-rp-iris">
                                                Spark of Life
                                            </div>
                                            <span className="text-[10px] bg-rp-overlay px-1.5 py-0.5 rounded text-rp-muted">50 Aether</span>
                                        </div>
                                        <div className="text-xs text-rp-muted">Animate this portrait with AI</div>
                                    </div>
                                    {isSparking ? (
                                        <div className="size-4 border-2 border-rp-iris border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <IconArrowNarrowRight size={18} className="text-rp-subtle group-hover:text-rp-text transition-colors" />
                                    )}

                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </button>
                            )}

                            {/* Voice Settings Button - Primary Place for Audio Studio */}
                            {isOwner && (
                                <Link
                                    href={`/studio/audio?persona=${selectedPersona.id}`}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rp-overlay/40 hover:bg-rp-overlay transition-colors group"
                                >
                                    <div className="flex items-center justify-center size-10 rounded-lg bg-indigo-500/20">
                                        <IconWaveSine size={20} className="text-indigo-400" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-rp-text">Voice Settings</span>
                                            {(selectedPersona as any).voice_id && (
                                                <span className="text-[10px] bg-rp-iris/20 text-rp-iris px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-rp-muted">Configure voice & TTS</div>
                                    </div>
                                    <IconArrowNarrowRight size={18} className="text-rp-subtle group-hover:text-rp-text transition-colors" />
                                </Link>
                            )}

                            {/* Change Hero Image Button (Owner Only) */}
                            {isOwner && (
                                <button
                                    onClick={() => {
                                        const fileInput = document.getElementById('hero-image-upload') as HTMLInputElement
                                        fileInput?.click()
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rp-overlay/40 hover:bg-rp-overlay transition-colors group"
                                >
                                    <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/20">
                                        <IconPhoto size={20} className="text-emerald-500" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium text-rp-text">Change Hero Image</div>
                                        <div className="text-xs text-rp-muted">Update character portrait</div>
                                    </div>
                                    <IconArrowNarrowRight size={18} className="text-rp-subtle group-hover:text-rp-text transition-colors" />
                                    <input
                                        type="file"
                                        id="hero-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return

                                            const toastId = toast.loading("Uploading new image...")
                                            try {
                                                const formData = new FormData()
                                                formData.append('file', file)
                                                formData.append('personaId', selectedPersona.id)

                                                const result = await updatePersonaImageActions(formData)

                                                if (result.error) throw new Error(result.error)

                                                toast.success("Hero image updated!", { id: toastId })
                                                window.location.reload() // Refresh to show new image
                                            } catch (err: any) {
                                                toast.error(err.message, { id: toastId })
                                            }
                                        }}
                                    />
                                </button>
                            )}

                            {/* Chat Settings Button */}
                            <button
                                onClick={() => {
                                    // TODO: Open chat settings modal
                                    alert("Chat Settings coming soon!")
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rp-overlay/40 hover:bg-rp-overlay transition-colors group"
                            >
                                <div className="flex items-center justify-center size-10 rounded-lg bg-rp-iris/20">
                                    <IconSettings size={20} className="text-rp-iris" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-medium text-rp-text">Chat Settings</div>
                                    <div className="text-xs text-rp-muted">Configure chat preferences</div>
                                </div>
                                <IconArrowNarrowRight size={18} className="text-rp-subtle group-hover:text-rp-text transition-colors" />
                            </button>

                            {/* Change Background Button */}
                            <button
                                onClick={() => {
                                    // Trigger file input from MiniProfile
                                    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
                                    fileInput?.click()
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rp-overlay/40 hover:bg-rp-overlay transition-colors group"
                            >
                                <div className="flex items-center justify-center size-10 rounded-lg bg-rp-love/20">
                                    <IconPhoto size={20} className="text-rp-love" />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-medium text-rp-text">Change Background</div>
                                    <div className="text-xs text-rp-muted">Upload custom chat background</div>
                                </div>
                                <IconArrowNarrowRight size={18} className="text-rp-subtle group-hover:text-rp-text transition-colors" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CharacterPanel
