"use client"

import Image from "next/image"
import { useContext } from "react"
import { RemrinContext } from "@/context/context"
import { cn } from "@/lib/utils"
import { IconUser } from "@tabler/icons-react"

interface UserAvatarProps {
    /** Size variant */
    size?: "xs" | "sm" | "md" | "lg" | "xl"
    /** Optional override URL (for viewing other users) */
    src?: string | null
    /** Optional override name (for viewing other users) */
    name?: string | null
    /** Show online indicator */
    showOnlineStatus?: boolean
    /** Additional class names */
    className?: string
    /** Click handler */
    onClick?: () => void
}

const SIZES = {
    xs: { container: "size-6", icon: 12, ring: "ring-1" },
    sm: { container: "size-8", icon: 16, ring: "ring-2" },
    md: { container: "size-10", icon: 20, ring: "ring-2" },
    lg: { container: "size-16", icon: 28, ring: "ring-2" },
    xl: { container: "size-24", icon: 40, ring: "ring-2" }
}

/**
 * UserAvatar - Unified avatar component
 * 
 * Uses RemrinContext.profile as the single source of truth
 * for the current user. Use `src` prop to display other users.
 */
export function UserAvatar({
    size = "md",
    src,
    name,
    showOnlineStatus = false,
    className,
    onClick
}: UserAvatarProps) {
    const { profile } = useContext(RemrinContext)

    // Determine the image source
    // Priority: explicit src > context profile > null
    const imageUrl = src !== undefined ? src : (profile as any)?.image_url
    const displayName = name !== undefined ? name : profile?.display_name || "User"

    const sizeConfig = SIZES[size]

    const AvatarContent = () => (
        <>
            {imageUrl ? (
                <Image
                    src={imageUrl}
                    alt={displayName || "User avatar"}
                    fill
                    sizes={sizeConfig.container.replace("size-", "") + "px"}
                    className="object-cover"
                />
            ) : (
                <IconUser size={sizeConfig.icon} />
            )}
        </>
    )

    return (
        <div
            className={cn(
                "relative shrink-0 overflow-hidden rounded-full",
                sizeConfig.container,
                sizeConfig.ring,
                imageUrl
                    ? "ring-rp-highlight-med"
                    : "flex items-center justify-center bg-rp-iris/20 text-rp-iris ring-rp-highlight-med",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            <AvatarContent />

            {/* Online indicator */}
            {showOnlineStatus && (
                <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-green-500 ring-2 ring-rp-surface" />
            )}
        </div>
    )
}
