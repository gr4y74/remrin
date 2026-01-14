"use client"

import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"
import { FeaturedManager } from "@/components/admin/FeaturedManager"
import { BannerManager } from "@/components/admin/BannerManager"

export default function AdminFeaturedPage() {
    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text">
                {/* Header */}
                <header className="border-b border-rp-highlight-med px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                        >
                            <IconArrowLeft size={20} />
                            Back to Admin
                        </Link>
                        <div className="h-6 w-px bg-rp-highlight-med" />
                        <h1 className="text-xl font-semibold">
                            ⭐ Featured Content Manager
                        </h1>
                    </div>
                </header>

                {/* Content */}
                <main className="mx-auto max-w-7xl p-6">
                    <div className="mb-12">
                        <BannerManager />
                    </div>

                    <div className="mb-6">
                        <h2 className="mb-2 text-2xl font-bold">Manage Featured Content</h2>
                        <p className="text-rp-subtle">
                            Control which Souls appear in the Hero Carousel and Gallery.
                        </p>
                    </div>

                    <FeaturedManager />
                </main>
            </div>
        </AdminPasswordGate>
    )
}
