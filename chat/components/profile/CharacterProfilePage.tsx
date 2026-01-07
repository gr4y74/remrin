"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CharacterHeader } from "./CharacterHeader"
import { SoulCardDisplay } from "./SoulCardDisplay"
import { MomentsGallery, MomentData } from "@/components/moments"
import { MessageCircle, ArrowLeft, Loader2, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useParallaxScroll } from "@/lib/animations"
import { cn } from "@/lib/utils"

interface PersonaStats {
    totalChats: number
    followersCount: number
}

interface PersonaData {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    category: string | null
    tags: string[]
    introMessage: string | null
    creatorName?: string | null
    ownerId?: string | null
    systemPrompt?: string | null
}

interface CharacterProfilePageProps {
    persona: PersonaData
    stats: PersonaStats
    isFollowing: boolean
    moments?: MomentData[]
    hasMoments?: boolean
}

export function CharacterProfilePage({
    persona,
    stats,
    isFollowing,
    moments = [],
    hasMoments = false
}: CharacterProfilePageProps) {
    const router = useRouter()
    const [isStartingChat, setIsStartingChat] = useState(false)
    const parallaxOffset = useParallaxScroll(0.3)

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
            {/* Blurred Hero Background with Parallax */}
            {persona.imageUrl && (
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        transform: `translateY(${parallaxOffset}px)`,
                        willChange: 'transform'
                    }}
                >
                    <Image
                        src={persona.imageUrl}
                        alt=""
                        fill
                        className="scale-110 object-cover opacity-30 blur-3xl"
                        priority
                    />
                    <div className="from-rp-base/50 via-rp-base/80 to-rp-base absolute inset-0 bg-gradient-to-b" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10">
                {/* Back Button */}
                <div className="animate-fade-in p-4 md:px-8">
                    <button
                        onClick={() => router.back()}
                        className="text-rp-subtle hover:text-rp-text inline-flex items-center gap-2 transition-all duration-300 hover:translate-x-[-4px]"
                    >
                        <ArrowLeft className="size-5" />
                        <span>Back</span>
                    </button>
                </div>

                {/* Main Content */}
                <main className="mx-auto max-w-4xl px-4 pb-24 pt-8 md:px-8">
                    <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
                        {/* Left Column - Soul Card */}
                        <div
                            className="animate-fade-in-up mx-auto w-full max-w-xs shrink-0 lg:mx-0"
                            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
                        >
                            <SoulCardDisplay
                                name={persona.name}
                                imageUrl={persona.imageUrl}
                                tags={persona.tags}
                            />
                        </div>

                        {/* Right Column - Character Details */}
                        <div className="flex-1 space-y-8">
                            {/* Header */}
                            <div
                                className="animate-fade-in-up"
                                style={{ animationDelay: '200ms', animationFillMode: 'both' }}
                            >
                                <CharacterHeader
                                    personaId={persona.id}
                                    name={persona.name}
                                    description={persona.description}
                                    imageUrl={persona.imageUrl}
                                    category={persona.category}
                                    totalChats={stats.totalChats}
                                    followersCount={stats.followersCount}
                                    isFollowing={isFollowing}
                                    creatorName={persona.creatorName}
                                />
                            </div>

                            {/* Intro Message Preview */}
                            {persona.introMessage && (
                                <div
                                    className="bg-rp-surface animate-fade-in-up hover:bg-rp-overlay rounded-2xl p-6 backdrop-blur-xl transition-all duration-300"
                                    style={{ animationDelay: '300ms', animationFillMode: 'both' }}
                                >
                                    <h2 className="text-rp-muted mb-3 text-sm font-semibold uppercase tracking-wider">
                                        First Message
                                    </h2>
                                    <p className="text-rp-text text-base italic leading-relaxed">
                                        &ldquo;{persona.introMessage}&rdquo;
                                    </p>
                                </div>
                            )}

                            {/* Start Chat CTA with floating animation */}
                            <div
                                className="animate-fade-in-up pt-4"
                                style={{ animationDelay: '400ms', animationFillMode: 'both' }}
                            >
                                <Button
                                    size="lg"
                                    onClick={handleStartChat}
                                    disabled={isStartingChat}
                                    className={cn(
                                        "from-rp-iris to-rp-foam text-rp-base group w-full rounded-2xl bg-gradient-to-r py-6 text-lg font-bold",
                                        "shadow-rp-iris/25 shadow-2xl transition-all duration-300",
                                        "hover:from-rp-iris/80 hover:to-rp-foam/80 hover:shadow-rp-iris/40 hover:scale-[1.02]",
                                        "disabled:opacity-70",
                                        !isStartingChat && "animate-float"
                                    )}
                                >
                                    {isStartingChat ? (
                                        <>
                                            <Loader2 className="mr-3 size-6 animate-spin" />
                                            Starting Chat...
                                        </>
                                    ) : (
                                        <>
                                            <MessageCircle className="mr-3 size-6 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                                            Start Chat
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Moments Section */}
                            {(hasMoments || moments.length > 0) && (
                                <div className="space-y-4">
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
                                        <div className="bg-rp-surface rounded-2xl p-8 text-center backdrop-blur-xl">
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
                    </div>
                </main>
            </div>
        </div>
    )
}
