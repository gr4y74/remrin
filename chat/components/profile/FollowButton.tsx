"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
    personaId: string
    initialIsFollowing: boolean
    onFollowChange?: (isFollowing: boolean) => void
}

export function FollowButton({
    personaId,
    initialIsFollowing,
    onFollowChange
}: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    const handleToggleFollow = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                // Redirect to login or show auth modal
                console.log("User not authenticated")
                setIsLoading(false)
                return
            }

            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from("character_follows")
                    .delete()
                    .eq("persona_id", personaId)
                    .eq("user_id", user.id)

                if (error) throw error
                setIsFollowing(false)
                onFollowChange?.(false)
            } else {
                // Follow
                const { error } = await supabase
                    .from("character_follows")
                    .insert({
                        persona_id: personaId,
                        user_id: user.id
                    })

                if (error) throw error
                setIsFollowing(true)
                onFollowChange?.(true)
            }
        } catch (error) {
            console.error("Error toggling follow:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            onClick={handleToggleFollow}
            disabled={isLoading}
            className={cn(
                "group relative overflow-hidden rounded-full px-6 py-2 font-semibold transition-all duration-300",
                isFollowing
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 shadow-lg shadow-purple-500/25"
            )}
        >
            <span className="flex items-center gap-2">
                <Heart
                    className={cn(
                        "size-5 transition-all duration-300",
                        isFollowing
                            ? "fill-red-500 text-red-500"
                            : "fill-transparent group-hover:fill-white/50"
                    )}
                />
                <span>{isFollowing ? "Following" : "Follow"}</span>
            </span>
        </Button>
    )
}
