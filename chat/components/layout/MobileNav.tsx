"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    IconHome,
    IconSparkles,
    IconMessage,
    IconBooks,
    IconUser,
} from "@tabler/icons-react"
import { useContext } from "react"
import { RemrinContext } from "@/context/context"
import { getUserProfileUrl } from "@/lib/user-profile-utils"

const MOBILE_NAV = [
    { icon: IconHome, label: "Discover", href: "/" },
    { icon: IconSparkles, label: "Feed", href: "/feed" },
    { icon: IconMessage, label: "Chat", href: "/chat" },
    { icon: IconBooks, label: "Collection", href: "/collection" },
    { icon: IconUser, label: "Profile", href: "/profile-link-placeholder" },
]


export function MobileNav() {
    const pathname = usePathname()
    const { selectedWorkspace, profile } = useContext(RemrinContext)

    return (
        <nav className="bg-rp-surface/95 border-rp-muted/20 fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg md:hidden">
            <div className="flex items-center justify-around">
                {MOBILE_NAV.map((item) => {
                    const Icon = item.icon
                    let href = item.href
                    let isDisabled = false

                    if (item.label === "Profile") {
                        href = `/${pathname.split("/")[1]}${getUserProfileUrl(profile?.username || "")}`
                    }

                    if (item.label === "Chat") {
                        if (selectedWorkspace) {
                            href = `/${pathname.split("/")[1]}/${selectedWorkspace.id}/chat`
                        } else {
                            isDisabled = true
                            href = "#"
                        }
                    }

                    const isActive = href !== "#" && (pathname === href || pathname.startsWith(href + "/"))

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            onClick={(e) => {
                                if (isDisabled) {
                                    e.preventDefault()
                                }
                            }}
                            className={cn(
                                "flex flex-1 flex-col items-center gap-1 py-3 transition-colors min-h-[44px]",
                                isActive ? "text-rp-iris" : "text-rp-subtle active:text-rp-text",
                                isDisabled && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <Icon size={24} className="shrink-0" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
            <div className="h-safe-area-inset-bottom" />
        </nav>
    )
}
