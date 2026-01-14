"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
    IconBrandDiscord,
    IconBrandReddit,
    IconBrandTiktok,
    IconBrandX,
    IconBrandInstagram
} from "@tabler/icons-react"

const socialLinks = [
    {
        href: "https://discord.gg/remrin",
        icon: IconBrandDiscord,
        label: "Remrin Discord"
    },
    {
        href: "https://reddit.com/r/remrin",
        icon: IconBrandReddit,
        label: "Remrin Reddit"
    },
    {
        href: "https://tiktok.com/@remrin_ai",
        icon: IconBrandTiktok,
        label: "Remrin TikTok"
    },
    {
        href: "https://twitter.com/remrin_ai",
        icon: IconBrandX,
        label: "Remrin Twitter"
    },
    {
        href: "https://instagram.com/remrin_ai",
        icon: IconBrandInstagram,
        label: "Remrin Instagram"
    }
]

const featuresLinks = [
    { href: "https://remrin.ai/faq", label: "FAQ", external: true },
    { href: "#", label: "Get App", isSpan: true },
    { href: "/create", label: "Create a Persona", external: false },
    { href: "https://remrin.ai/manage-data", label: "Your Privacy Choices", external: true },
    { href: "https://remrin.ai/delete-account", label: "Delete Account", external: true }
]

const exploreLinks = [
    { href: "/featured", label: "Featured Characters" },
    { href: "/tags", label: "Browse Tags" },
    { href: "/multilingual", label: "Multilingual Chat" },
    { href: "/community", label: "Community Creations" },
    { href: "/updates", label: "Latest Updates" }
]

const overviewLinks = [
    { href: "https://remrin.ai/about", label: "About Us", external: true },
    { href: "https://blog.remrin.ai", label: "Remrin Blog", external: true },
    { href: "https://remrin.ai/contact", label: "Contact & Support", external: true },
    { href: "https://remrin.ai/terms", label: "Terms of Service", external: true },
    { href: "https://remrin.ai/privacy", label: "Privacy Policy", external: true },
    { href: "/guidelines", label: "Community Guidelines", external: false }
]

export function Footer() {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const logoSrc = resolvedTheme === "light" ? "/logo_dark.svg" : "/logo.svg"

    return (
        <footer className="w-full border-t border-rp-highlight-low bg-rp-base/80 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Column */}
                    <section className="flex flex-col items-start gap-4">
                        {mounted && (
                            <Image
                                src={logoSrc}
                                alt="Remrin logo"
                                width={140}
                                height={40}
                                className="h-10 w-auto"
                            />
                        )}

                        {/* Social Media Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.href}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-rp-subtle hover:text-rp-rose transition-colors duration-200"
                                    aria-label={social.label}
                                >
                                    <social.icon size={22} stroke={1.5} />
                                </a>
                            ))}
                        </div>

                        <p className="text-sm text-rp-muted">
                            Copyright © 2025 Remrin AI. All rights reserved
                        </p>
                    </section>

                    {/* Features Column */}
                    <nav className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-rp-text">Features</p>
                        {featuresLinks.map((link, index) =>
                            link.isSpan ? (
                                <span key={index} className="text-sm text-rp-subtle cursor-default">
                                    {link.label}
                                </span>
                            ) : link.external ? (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-rp-subtle hover:text-rp-rose transition-colors duration-200"
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-rp-subtle hover:text-rp-rose transition-colors duration-200"
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                    </nav>

                    {/* Explore Column */}
                    <nav className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-rp-text">Explore</p>
                        {exploreLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-sm text-rp-subtle hover:text-rp-rose transition-colors duration-200"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Overview Column */}
                    <nav className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-rp-text">Overview</p>
                        {overviewLinks.map((link) =>
                            link.external ? (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-rp-subtle hover:text-rp-rose transition-colors duration-200"
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-rp-subtle hover:text-rp-rose transition-colors duration-200"
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                        <span className="mt-2 text-xs text-rp-muted">
                            Powered by Remrin AI
                        </span>
                    </nav>
                </div>
            </div>
        </footer>
    )
}
