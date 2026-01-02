"use client"

import Link from "next/link"
import {
    IconShield,
    IconUsers,
    IconChartBar,
    IconSettings,
    IconArrowLeft,
    IconStar,
    IconDiamond,
    IconRocket
} from "@tabler/icons-react"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"

export default function AdminPage() {
    const adminModules = [
        {
            title: "Mission Control",
            description: "System State Audit & Feature Manifest",
            icon: IconRocket,
            href: "/admin/mission-control",
            color: "from-rp-rose to-purple-600",
            badge: "NEW"
        },
        {
            title: "Featured Content",
            description: "Manage Hero Carousel and Gallery visibility",
            icon: IconStar,
            href: "/admin/featured",
            color: "from-amber-600 to-orange-500",
            badge: null
        },
        {
            title: "Tier Management",
            description: "Configure features, limits, and LLM providers per tier",
            icon: IconDiamond,
            href: "/admin/tiers",
            color: "from-violet-600 to-purple-500",
            badge: null
        },
        {
            title: "Chat Engine Config",
            description: "Configure LLM providers, search, and API keys",
            icon: IconSettings,
            href: "/admin/chat-config",
            color: "from-cyan-600 to-blue-500",
            badge: null
        },
        {
            title: "Content Moderation",
            description: "Review and approve pending Soul submissions",
            icon: IconShield,
            href: "/admin/moderation",
            color: "from-purple-600 to-pink-500",
            badge: null // Could show pending count here
        },
        {
            title: "User Management",
            description: "Manage users, creators, and permissions",
            icon: IconUsers,
            href: "/admin/users",
            color: "from-blue-600 to-cyan-500",
            badge: "Coming Soon"
        },
        {
            title: "Analytics",
            description: "View engagement metrics and trends",
            icon: IconChartBar,
            href: "/admin/analytics",
            color: "from-green-600 to-emerald-500",
            badge: null
        },
        {
            title: "Settings",
            description: "LLM configuration, API keys, and platform settings",
            icon: IconSettings,
            href: "/admin/settings",
            color: "from-rp-muted to-rp-highlight-high",
            badge: null
        }
    ]

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
                {/* Header */}
                <header className="border-b border-rp-highlight-med px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                        >
                            <IconArrowLeft size={20} />
                            Back to App
                        </Link>
                        <div className="h-6 w-px bg-rp-highlight-med" />
                        <h1 className="text-xl font-semibold">
                            🔧 Admin Dashboard
                        </h1>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-4xl p-6">
                    <div className="mb-8">
                        <h2 className="mb-2 text-2xl font-bold">Welcome, Admin</h2>
                        <p className="text-rp-subtle">
                            Manage content, users, and platform settings from here.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {adminModules.map((module) => (
                            <Link
                                key={module.title}
                                href={module.href}
                                className={`group relative block rounded-xl border border-rp-highlight-med bg-rp-surface p-6 transition-all hover:border-rp-highlight-high hover:bg-rp-overlay ${module.badge === 'Coming Soon' ? 'pointer-events-none opacity-50' : ''
                                    }`}
                            >
                                <div className={`inline-flex rounded-lg bg-gradient-to-br p-3 ${module.color} mb-4`}>
                                    <module.icon size={24} className="text-white" />
                                </div>
                                <h3 className="mb-1 text-lg font-semibold">{module.title}</h3>
                                <p className="text-sm text-rp-subtle">{module.description}</p>

                                {module.badge && (
                                    <span className="absolute right-4 top-4 rounded bg-rp-highlight-med px-2 py-1 text-xs text-rp-muted">
                                        {module.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-8 rounded-xl border border-rp-highlight-med bg-rp-surface p-6">
                        <h3 className="mb-4 text-lg font-semibold">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-rp-gold">—</div>
                                <div className="text-sm text-rp-muted">Pending Reviews</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-rp-foam">—</div>
                                <div className="text-sm text-rp-muted">Approved Today</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-rp-iris">—</div>
                                <div className="text-sm text-rp-muted">Total Souls</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-rp-pine">—</div>
                                <div className="text-sm text-rp-muted">Active Users</div>
                            </div>
                        </div>
                        <p className="mt-4 text-center text-xs text-rp-muted">
                            Stats will be populated once analytics module is complete
                        </p>
                    </div>
                </main>
            </div>
        </AdminPasswordGate>
    )
}

