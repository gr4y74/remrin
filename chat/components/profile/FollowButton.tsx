"use client"

import { useState, useCallback } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FollowButtonProps {
    personaId: string
    initialIsFollowing: boolean
    initialFollowerCount?: number
    onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
    personaId,
    initialIsFollowing,
    initialFollowerCount = 0,
    onFollowChange
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [followerCount, setFollowerCount] = useState(initialFollowerCount)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleToggleFollow = useCallback(async () => {
        // Get user first
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            toast.error("Please sign in to follow")
            return
        }

        // Optimistic update - change UI immediately
        const previousState = isFollowing
        const previousCount = followerCount
        setIsFollowing(!isFollowing)
        setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
        onFollowChange?.(!isFollowing)

        setIsLoading(true)

        try {
            if (previousState) {
                // Was following, now unfollowing
                const { error } = await supabase
                    .from("character_follows")
                    .delete()
                    .eq("persona_id", personaId)
                    .eq("user_id", user.id)

                if (error) throw error
            } else {
                // Was not following, now following
                const { error } = await supabase
                    .from("character_follows")
                    .insert({
                        persona_id: personaId,
                        user_id: user.id
                    })

                if (error) throw error
            }
        } catch (error) {
            // Revert optimistic update on error
            console.error("Error toggling follow:", error)
            setIsFollowing(previousState)
            setFollowerCount(previousCount)
            onFollowChange?.(previousState)
            toast.error("Failed to update follow status")
        } finally {
            setIsLoading(false)
        }
    }, [isFollowing, followerCount, personaId, supabase, onFollowChange])

    return (
        <div className="flex items-center gap-3">
            <Button
                onClick={handleToggleFollow}
                disabled={isLoading}
                className={cn(
                    "group relative overflow-hidden rounded-full px-6 py-2 font-semibold transition-all duration-300",
                    isFollowing
                        ? "bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400"
                        : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-500/25"
                )}
            >
                <span className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <Heart
                            className={cn(
                                "size-5 transition-all duration-300",
                                isFollowing
                                    ? "fill-red-500 text-red-500"
                                    : "fill-transparent group-hover:fill-white/50"
                            )}
                        />
                    )}
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                </span>
            </Button>

            {/* Follower count display */}
            {followerCount > 0 && (
                <span className="text-sm text-zinc-400">
                    {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
                </span>
            )}
        </div>
    )
}
