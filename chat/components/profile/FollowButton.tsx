"use client"

import { useState, useCallback } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FollowButtonProps {
    personaId: string
    initialIsFollowing?: boolean
    initialFollowerCount?: number
    onFollowChange?: (isFollowing: boolean) => void
    compact?: boolean
}

export function FollowButton({
    personaId,
    initialIsFollowing = false,
    initialFollowerCount = 0,
    onFollowChange,
    compact = false
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
        <div className={cn("flex items-center", compact ? "gap-2" : "gap-3")}>
            <Button
                onClick={handleToggleFollow}
                disabled={isLoading}
                className={cn(
                    "group relative overflow-hidden rounded-full font-semibold transition-all duration-300",
                    compact ? "px-3 py-1 text-sm" : "px-6 py-2",
                    isFollowing
                        ? "bg-white/10 text-white hover:bg-rp-love/20 hover:text-rp-love"
                        : "bg-gradient-to-r from-rp-iris to-rp-foam text-rp-base hover:from-rp-iris/80 hover:to-rp-foam/80 shadow-lg shadow-rp-iris/25"
                )}
            >
                <span className="flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className={cn("animate-spin", compact ? "size-4" : "size-5")} />
                    ) : (
                        <Heart
                            className={cn(
                                "transition-all duration-300",
                                compact ? "size-4" : "size-5",
                                isFollowing
                                    ? "fill-rp-love text-rp-love"
                                    : "fill-transparent group-hover:fill-rp-base/50"
                            )}
                        />
                    )}
                    <span>{isFollowing ? "Following" : "Follow"}</span>
                </span>
            </Button>

            {/* Follower count display - hide in compact mode */}
            {!compact && followerCount > 0 && (
                <span className="text-sm text-rp-subtle">
                    {followerCount.toLocaleString()} {followerCount === 1 ? "follower" : "followers"}
                </span>
            )}
        </div>
    )
}
