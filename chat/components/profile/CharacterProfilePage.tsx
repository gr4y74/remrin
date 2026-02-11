"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FollowButton } from "./FollowButton"
import { MomentsGallery, MomentData } from "@/components/moments"
import { MessageCircle, ArrowLeft, Loader2, ImageIcon, Users, ThumbsUp, ThumbsDown, Eye, Star, X, User, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { WelcomeAudioPlayer } from "@/components/audio/WelcomeAudioPlayer"

interface PersonaStats {
    totalChats: number
    followersCount: number
}

interface PersonaData {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    videoUrl?: string | null
    backgroundUrl?: string | null
    category: string | null
    tags: string[]
    introMessage: string | null
    creatorName?: string | null
    ownerId?: string | null
    systemPrompt?: string | null
    welcomeAudioUrl?: string | null
}

interface CharacterProfilePageProps {
    persona: PersonaData
    stats: PersonaStats
    isFollowing: boolean
    isOwner?: boolean
    moments?: MomentData[]
    hasMoments?: boolean
}

// Format large numbers: 12500 -> "12.5K"
function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
}

// Color palette for tag pills
const tagColors = [
    "bg-rp-iris/20 text-rp-iris border-rp-iris/30",
    "bg-rp-foam/20 text-rp-foam border-rp-foam/30",
    "bg-rp-rose/20 text-rp-rose border-rp-rose/30",
    "bg-rp-gold/20 text-rp-gold border-rp-gold/30",
]

function getTagColor(index: number): string {
    return tagColors[index % tagColors.length]
}

export function CharacterProfilePage({
    persona,
    stats: initialStats,
    isFollowing: initialIsFollowing,
    isOwner,
    moments = [],
    hasMoments = false
}: CharacterProfilePageProps) {
    const router = useRouter()
    const [isStartingChat, setIsStartingChat] = useState(false)
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [followerCount, setFollowerCount] = useState(initialStats.followersCount)
    const [upvotes, setUpvotes] = useState(7) // Mock data - replace with real data
    const [hasUpvoted, setHasUpvoted] = useState(false)
    const [hasDownvoted, setHasDownvoted] = useState(false)

    const handleStartChat = async () => {
        setIsStartingChat(true)
        try {
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }

            // Get user's default workspace
            const { data: workspaces } = await supabase
                .from("workspaces")
                .select("id")
                .eq("user_id", user.id)
                .limit(1)
                .single()

            if (!workspaces) {
                console.error("No workspace found")
                setIsStartingChat(false)
                return
            }

            // Redirect to chat with persona param
            router.push(`/${workspaces.id}/chat?persona=${persona.id}`)
        } catch (error) {
            console.error("Error starting chat:", error)
            setIsStartingChat(false)
        }
    }

    const handleUpvote = () => {
        if (hasUpvoted) {
            setUpvotes(prev => prev - 1)
            setHasUpvoted(false)
        } else {
            if (hasDownvoted) {
                setUpvotes(prev => prev + 2)
                setHasDownvoted(false)
            } else {
                setUpvotes(prev => prev + 1)
            }
            setHasUpvoted(true)
        }
    }

    const handleDownvote = () => {
        if (hasDownvoted) {
            setUpvotes(prev => prev + 1)
            setHasDownvoted(false)
        } else {
            if (hasUpvoted) {
                setUpvotes(prev => prev - 2)
                setHasUpvoted(false)
            } else {
                setUpvotes(prev => prev - 1)
            }
            setHasDownvoted(true)
        }
    }

    // Split tags into personality and character tags
    const personalityTags = ["playful", "supportive", "flirty", "intimate", "teasing"]
    const characterTags = persona.tags.filter(tag => !personalityTags.includes(tag.toLowerCase()))

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Blurred Background */}
            <div className="fixed inset-0 z-0">
                {persona.videoUrl ? (
                    <video
                        src={persona.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover blur-3xl scale-110"
                    />
                ) : persona.imageUrl ? (
                    <Image
                        src={persona.imageUrl}
                        alt={persona.name}
                        fill
                        className="object-cover blur-3xl scale-110"
                        priority
                        sizes="100vw"
                    />
                ) : (
                    <div className="from-rp-iris/50 to-rp-foam/50 flex size-full items-center justify-center bg-gradient-to-br blur-3xl" />
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/60" />
            </div>



            {/* SINGLE MODAL CONTAINER with TWO-COLUMN LAYOUT */}
            <div className="relative z-10 flex min-h-screen items-center justify-center gap-4 p-4 lg:p-8">


                {/* Modal with exact specifications: 900px x 600px */}
                <div
                    className="bg-rp-base/95 flex overflow-hidden rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl"
                    style={{
                        width: '900px',
                        maxWidth: '90vw',
                        height: '600px',
                        maxHeight: '85vh'
                    }}
                >
                    {/* LEFT COLUMN: Hero Image (40% width on desktop, hidden on mobile) */}
                    <div className="relative hidden lg:block lg:w-[40%]">
                        {/* Category Badge - Top Left of Image */}
                        {persona.category && (
                            <Badge className="bg-rp-iris/90 text-white border-0 absolute left-4 top-4 z-10 rounded-full px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                                {persona.category}
                            </Badge>
                        )}

                        {/* Back Button - Bottom Left of Image */}
                        <button
                            onClick={() => router.back()}
                            className="bg-black/50 hover:bg-black/70 text-white absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-md transition-all duration-300 active:scale-95"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="size-4" />
                            <span className="text-sm font-medium">Back</span>
                        </button>

                        {persona.videoUrl ? (
                            <video
                                src={persona.videoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        ) : persona.imageUrl ? (
                            <Image
                                src={persona.imageUrl}
                                alt={persona.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="600px"
                            />
                        ) : (
                            <div className="from-rp-iris/50 to-rp-foam/50 flex size-full items-center justify-center bg-gradient-to-br">
                                <span className="text-rp-text/50 text-9xl font-bold">
                                    {persona.name.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Character Information (60% width on desktop, 100% on mobile) */}
                    <div className="relative flex w-full flex-col overflow-y-auto p-8 lg:w-[60%]">
                        {/* Category Badge - Mobile Only */}
                        {persona.category && (
                            <Badge className="bg-rp-iris/20 text-rp-iris border-rp-iris/30 mb-6 rounded-full border px-4 py-1.5 text-sm font-medium lg:hidden">
                                {persona.category}
                            </Badge>
                        )}

                        {/* Close Button - Top Right */}
                        <button
                            onClick={() => router.back()}
                            className="text-rp-subtle hover:text-rp-text absolute right-4 top-4 rounded-full p-2 transition-colors hover:bg-white/5"
                            aria-label="Close profile"
                        >
                            <X className="size-5" />
                        </button>

                        {/* Character Name & Creator */}
                        <div className="mb-6 space-y-3">
                            <div className="flex items-center gap-4">
                                <h1 className="font-tiempos-headline text-rp-text text-4xl font-bold tracking-tight lg:text-5xl">
                                    {persona.name}
                                </h1>
                                {persona.welcomeAudioUrl && (
                                    <WelcomeAudioPlayer
                                        audioUrl={persona.welcomeAudioUrl}
                                        autoPlay
                                        className="mb-1"
                                    />
                                )}
                            </div>
                            {persona.creatorName && (
                                <div className="text-rp-subtle flex items-center gap-2 text-sm">
                                    <User className="size-4" />
                                    <span>Created by {persona.creatorName}</span>
                                </div>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="mb-6">
                            <h3 className="text-rp-text mb-3 text-xs font-semibold uppercase tracking-wide">Character Stats</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-rp-surface/50 rounded-xl border border-white/5 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <ThumbsUp className="text-rp-foam size-4" />
                                        <span className="text-rp-subtle text-xs font-medium uppercase tracking-wide">Upvotes</span>
                                    </div>
                                    <div className="text-rp-foam text-2xl font-bold">{upvotes}</div>
                                </div>
                                <div className="bg-rp-surface/50 rounded-xl border border-white/5 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Eye className="text-rp-iris size-4" />
                                        <span className="text-rp-subtle text-xs font-medium uppercase tracking-wide">Used</span>
                                    </div>
                                    <div className="text-rp-iris text-2xl font-bold">{formatCount(initialStats.totalChats)}</div>
                                </div>
                                <div className="bg-rp-surface/50 rounded-xl border border-white/5 p-4">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Star className="text-rp-foam size-4" />
                                        <span className="text-rp-subtle text-xs font-medium uppercase tracking-wide">Rating</span>
                                    </div>
                                    <div className="text-rp-foam text-2xl font-bold">100%</div>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        {persona.description && (
                            <div className="mb-6">
                                <h3 className="text-rp-text mb-2 text-xs font-semibold uppercase tracking-wide">About</h3>
                                <p className="text-rp-subtle text-sm leading-relaxed">
                                    {persona.description}
                                </p>
                            </div>
                        )}

                        {/* Personality Tags */}
                        {personalityTags.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-rp-text mb-3 text-xs font-semibold uppercase tracking-wide">Personality</h3>
                                <div className="flex flex-wrap gap-2">
                                    {personalityTags.map((tag, index) => (
                                        <Badge
                                            key={tag}
                                            className={cn(
                                                "rounded-full border px-3 py-1.5 text-sm font-medium capitalize",
                                                getTagColor(index)
                                            )}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Character Tags */}
                        {characterTags.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-rp-text mb-3 text-xs font-semibold uppercase tracking-wide">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {characterTags.map((tag, index) => (
                                        <Badge
                                            key={tag}
                                            className="bg-rp-iris/10 text-rp-iris border-rp-iris/20 rounded-full border px-3 py-1.5 text-sm font-medium"
                                        >
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}



                        {/* Action Buttons */}
                        <div className="mt-auto space-y-3">
                            {/* Upvote/Downvote Row */}
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleUpvote}
                                    className={cn(
                                        "border-rp-muted hover:bg-rp-surface/50 rounded-xl py-5 text-sm font-semibold transition-all",
                                        hasUpvoted && "bg-rp-foam/20 border-rp-foam text-rp-foam"
                                    )}
                                >
                                    <ThumbsUp className="mr-2 size-4" />
                                    Upvote ({upvotes})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={handleDownvote}
                                    className={cn(
                                        "border-rp-muted hover:bg-rp-surface/50 rounded-xl py-5 text-sm font-semibold transition-all",
                                        hasDownvoted && "bg-rp-rose/20 border-rp-rose text-rp-rose"
                                    )}
                                >
                                    <ThumbsDown className="mr-2 size-4" />
                                    Downvote (0)
                                </Button>
                            </div>

                            {/* Warning Icon + Primary Action Button */}
                            <div className="flex items-center gap-3">
                                <button
                                    className="text-rp-rose hover:text-rp-rose/80 flex-shrink-0 rounded-xl border border-rp-rose/30 bg-rp-rose/10 p-3 transition-colors"
                                    aria-label="Report content"
                                >
                                    <AlertTriangle className="size-5" />
                                </button>
                                <Button
                                    size="lg"
                                    onClick={handleStartChat}
                                    disabled={isStartingChat}
                                    className={cn(
                                        "from-rp-iris to-rp-foam group w-full rounded-xl bg-gradient-to-r py-5 text-base font-bold text-white",
                                        "shadow-rp-iris/25 shadow-xl transition-all duration-300",
                                        "hover:from-rp-iris/80 hover:to-rp-foam/80 hover:shadow-rp-iris/40 hover:scale-[1.02]",
                                        "active:scale-95 disabled:opacity-70"
                                    )}
                                >
                                    {isStartingChat ? (
                                        <>
                                            <Loader2 className="mr-2 size-5 animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="mr-2 size-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                                            Use Companion
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Moments Gallery - Below the modal (if applicable) */}
            {hasMoments && moments.length > 0 && (
                <div className="relative z-10 px-4 pb-12 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <MomentsGallery
                            initialMoments={moments}
                            personaId={persona.id}
                            personaName={persona.name}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
