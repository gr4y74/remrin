"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FollowButton } from "./FollowButton"
import { MomentsGallery, MomentData } from "@/components/moments"
import { MessageCircle, ArrowLeft, Loader2, ImageIcon, Users } from "lucide-react"
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

    return (
        <div className="bg-rp-base relative min-h-screen">
            {/* Back Button - Compact on mobile */}
            <div className="animate-fade-in absolute left-3 top-3 z-20 md:left-8 md:top-8">
                <button
                    onClick={() => router.back()}
                    className="text-rp-subtle hover:text-rp-text inline-flex items-center gap-1.5 md:gap-2 rounded-full bg-black/50 px-3 py-1.5 md:px-4 md:py-2 backdrop-blur-md transition-all duration-300 hover:bg-black/60 active:scale-95"
                >
                    <ArrowLeft className="size-4 md:size-5" />
                    <span className="text-sm md:text-base">Back</span>
                </button>
            </div>

            {/* Hero Image Section - Full width, taller on mobile */}
            <div className="relative h-[60vh] min-h-[350px] max-h-[500px] md:h-[50vh] md:min-h-[400px] md:max-h-[600px] w-full overflow-hidden">
                {persona.videoUrl ? (
                    <>
                        <video
                            src={persona.videoUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 h-full w-full object-cover object-top md:object-center"
                        />
                        {/* Gradient Overlay - Stronger on mobile for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-rp-base/40 via-rp-base/20 to-rp-base md:from-rp-base/60 md:via-rp-base/40" />
                    </>
                ) : persona.imageUrl ? (
                    <>
                        <Image
                            src={persona.imageUrl}
                            alt={persona.name}
                            fill
                            className="object-cover object-top md:object-center"
                            priority
                            sizes="100vw"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-rp-base/40 via-rp-base/20 to-rp-base md:from-rp-base/60 md:via-rp-base/40" />
                    </>
                ) : (
                    <div className="from-rp-iris/50 to-rp-foam/50 flex size-full items-center justify-center bg-gradient-to-br">
                        <span className="text-rp-text/50 text-7xl md:text-9xl font-bold">
                            {persona.name.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Welcome Audio Player */}
                {persona.welcomeAudioUrl && (
                    <WelcomeAudioPlayer
                        audioUrl={persona.welcomeAudioUrl}
                        autoPlay
                        className="absolute bottom-3 right-3 md:bottom-4 md:right-4 z-20"
                    />
                )}
            </div>

            {/* Main Content - Centered Single Column */}
            <main className="relative -mt-20 md:-mt-16 pb-24">
                <div className="mx-auto max-w-3xl px-3 sm:px-4 md:px-8">
                    {/* Info Card */}
                    <div className="animate-fade-in-up rounded-2xl md:rounded-3xl border border-white/10 bg-rp-base/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl md:p-8">
                        {/* Name and Category */}
                        <div className="mb-3 md:mb-4 text-center">
                            <h1 className="font-tiempos-headline text-rp-text mb-2 text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">
                                {persona.name}
                            </h1>
                            {persona.category && (
                                <Badge
                                    variant="secondary"
                                    className="bg-rp-overlay text-rp-text hover:bg-rp-overlay/80 rounded-full px-3 py-0.5 md:px-4 md:py-1 text-xs md:text-sm font-medium"
                                >
                                    {persona.category}
                                </Badge>
                            )}
                        </div>

                        {/* Description */}
                        {persona.description && (
                            <p className="text-rp-subtle mb-4 md:mb-6 text-center text-sm sm:text-base leading-relaxed md:text-lg">
                                {persona.description}
                            </p>
                        )}

                        {/* Tags - Horizontal scroll on mobile */}
                        {persona.tags.length > 0 && (
                            <div className="mb-4 md:mb-6 -mx-4 px-4 md:mx-0 md:px-0">
                                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide md:flex-wrap md:justify-center md:overflow-visible snap-x snap-mandatory">
                                    {persona.tags.slice(0, 8).map((tag, index) => (
                                        <Badge
                                            key={tag}
                                            className={cn(
                                                "rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0 snap-start",
                                                getTagColor(index)
                                            )}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                    {persona.tags.length > 8 && (
                                        <Badge className="border-rp-muted bg-rp-surface/50 text-rp-subtle rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap shrink-0">
                                            +{persona.tags.length - 8}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Stats Row - Compact on mobile */}
                        <div className="text-rp-subtle mb-4 md:mb-6 flex items-center justify-center gap-4 md:gap-6 border-y border-white/5 py-3 md:py-4">
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <MessageCircle className="text-rp-iris size-4 md:size-5" />
                                <span className="text-rp-text font-semibold text-sm md:text-base">{formatCount(initialStats.totalChats)}</span>
                                <span className="text-xs md:text-sm">chats</span>
                            </div>
                            <div className="bg-rp-overlay h-4 w-px" />
                            <div className="flex items-center gap-1.5 md:gap-2">
                                <Users className="text-rp-foam size-4 md:size-5" />
                                <span className="text-rp-text font-semibold text-sm md:text-base">{formatCount(followerCount)}</span>
                                <span className="text-xs md:text-sm">followers</span>
                            </div>
                        </div>

                        {/* CTA Buttons - Full width stacked on mobile, prominent */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
                            <Button
                                size="lg"
                                onClick={handleStartChat}
                                disabled={isStartingChat}
                                className={cn(
                                    "from-rp-iris to-rp-foam text-rp-base group w-full sm:flex-1 rounded-xl md:rounded-2xl bg-gradient-to-r py-4 md:py-6 text-base md:text-lg font-bold",
                                    "shadow-rp-iris/25 shadow-xl md:shadow-2xl transition-all duration-300",
                                    "hover:from-rp-iris/80 hover:to-rp-foam/80 hover:shadow-rp-iris/40 hover:scale-[1.02]",
                                    "active:scale-95 disabled:opacity-70",
                                    "min-h-[52px] md:min-h-[60px]"
                                )}
                            >
                                {isStartingChat ? (
                                    <>
                                        <Loader2 className="mr-2 md:mr-3 size-5 md:size-6 animate-spin" />
                                        Starting Chat...
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="mr-2 md:mr-3 size-5 md:size-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                                        Start Chat
                                    </>
                                )}
                            </Button>

                            <FollowButton
                                personaId={persona.id}
                                initialIsFollowing={isFollowing}
                                initialFollowerCount={followerCount}
                                onFollowChange={(newVal) => {
                                    setIsFollowing(newVal)
                                    setFollowerCount(prev => newVal ? prev + 1 : Math.max(0, prev - 1))
                                }}
                                className="w-full sm:w-auto sm:flex-initial rounded-xl md:rounded-2xl py-4 md:py-6 text-base md:text-lg sm:min-w-[140px] min-h-[52px] md:min-h-[60px]"
                            />
                        </div>

                        {/* Creator Attribution */}
                        {persona.creatorName && (
                            <p className="text-rp-muted mt-4 text-center text-sm">
                                Created by <span className="text-rp-subtle">{persona.creatorName}</span>
                            </p>
                        )}
                    </div>

                    {/* Intro Message Preview */}
                    {persona.introMessage && (
                        <div
                            className="animate-fade-in-up mt-8 rounded-2xl border border-white/5 bg-rp-base/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/10"
                            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
                        >
                            <h2 className="text-rp-muted mb-3 text-sm font-semibold uppercase tracking-wider">
                                First Message
                            </h2>
                            <p className="text-rp-text text-base italic leading-relaxed">
                                &ldquo;{persona.introMessage}&rdquo;
                            </p>
                        </div>
                    )}

                    {/* Moments Section */}
                    {(hasMoments || moments.length > 0) && (
                        <div
                            className="animate-fade-in-up mt-8 space-y-4"
                            style={{ animationDelay: '200ms', animationFillMode: 'both' }}
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-rp-text flex items-center gap-2 text-lg font-semibold">
                                    <ImageIcon className="text-rp-iris size-5" />
                                    Moments
                                </h2>
                                {moments.length > 0 && (
                                    <Link
                                        href={`/moments?persona=${persona.id}`}
                                        className="text-rp-iris hover:text-rp-rose text-sm transition-colors"
                                    >
                                        View All →
                                    </Link>
                                )}
                            </div>
                            {moments.length > 0 ? (
                                <MomentsGallery
                                    initialMoments={moments}
                                    personaId={persona.id}
                                    initialHasMore={false}
                                    showViewAllLink={true}
                                    viewAllHref={`/moments?persona=${persona.id}`}
                                />
                            ) : (
                                <div className="rounded-2xl border border-white/5 bg-rp-base/60 p-8 text-center backdrop-blur-xl">
                                    <ImageIcon className="text-rp-muted mx-auto mb-3 size-12" />
                                    <p className="text-rp-subtle">No moments yet</p>
                                    <p className="text-rp-muted mt-1 text-sm">
                                        Check back later for gallery content
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
