"use client"

import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"
import { FeaturedManager } from "@/components/admin/FeaturedManager"

export default function AdminFeaturedPage() {
    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-zinc-950 text-white">
                {/* Header */}
                <header className="border-b border-zinc-800 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <IconArrowLeft size={20} />
                            Back to Admin
                        </Link>
                        <div className="h-6 w-px bg-zinc-800" />
                        <h1 className="text-xl font-semibold">
                            ⭐ Featured Content Manager
                        </h1>
                    </div>
                </header>

                {/* Content */}
                <main className="p-6 max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-2">Manage Featured Content</h2>
                        <p className="text-zinc-400">
                            Control which Souls appear in the Hero Carousel and Gallery.
                        </p>
                    </div>

                    <FeaturedManager />
                </main>
            </div>
        </AdminPasswordGate>
    )
}
