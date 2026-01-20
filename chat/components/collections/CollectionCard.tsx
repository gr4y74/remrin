"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Folder, Globe, Lock, MoreVertical, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { TYPOGRAPHY, SPACING } from "@/lib/design-system"
import { Badge } from "@/components/ui/badge"

interface CollectionCardProps {
    id: string
    name: string
    description: string | null
    itemCount: number
    visibility: "PRIVATE" | "PUBLIC" | "UNLISTED"
    coverImageUrl: string | null
    className?: string
}

export function CollectionCard({
    id,
    name,
    description,
    itemCount,
    visibility,
    coverImageUrl,
    className
}: CollectionCardProps) {
    const [isHovering, setIsHovering] = useState(false)

    return (
        <Link href={`/collections/${id}`} className="block">
            <div
                className={cn(
                    "group relative overflow-hidden rounded-2xl border border-rp-muted/20 bg-rp-surface transition-all duration-300 ease-out",
                    "hover:border-rp-iris/40 hover:shadow-xl hover:shadow-rp-iris/10",
                    className
                )}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {/* Cover Image / Placeholder */}
                <div className="relative aspect-video w-full overflow-hidden">
                    {coverImageUrl ? (
                        <Image
                            src={coverImageUrl}
                            alt={name}
                            fill
                            className={cn(
                                "object-cover transition-transform duration-500",
                                isHovering ? "scale-105" : "scale-100"
                            )}
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-rp-iris/20 to-rp-foam/20">
                            <Folder className="size-12 text-rp-iris/40" />
                        </div>
                    )}

                    {/* Visibility Badge */}
                    <div className="absolute right-3 top-3">
                        <Badge className="bg-rp-base/60 border-0 px-2 py-1 text-[10px] backdrop-blur-md">
                            {visibility === "PUBLIC" ? (
                                <Globe className="mr-1 size-3" />
                            ) : visibility === "PRIVATE" ? (
                                <Lock className="mr-1 size-3" />
                            ) : (
                                <User className="mr-1 size-3" />
                            )}
                            {visibility}
                        </Badge>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-rp-base/90 via-rp-base/20 to-transparent" />

                    {/* Item Count */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-rp-text/70">
                        <div className="flex size-5 items-center justify-center rounded-full bg-rp-iris/20 text-rp-iris">
                            <span className="text-[10px]">{itemCount}</span>
                        </div>
                        Characters
                    </div>
                </div>

                {/* Content */}
                <div className={cn("p-4", SPACING.card.small)}>
                    <h3 className={cn(
                        TYPOGRAPHY.heading.h4,
                        "line-clamp-1 text-rp-rose transition-colors group-hover:text-rp-iris"
                    )}>
                        {name}
                    </h3>
                    {description && (
                        <p className="mt-1 line-clamp-2 text-sm text-rp-subtle">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    )
}
