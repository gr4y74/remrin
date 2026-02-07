"use client"

import { useState } from "react"
import Link from "next/link"
import { GenerationStudio } from "@/components/studio/GenerationStudio"
import { IconArrowLeft, IconPhoto, IconVideo, IconPencil } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

export default function StudioVisualsPage() {
    const [activeTab, setActiveTab] = useState<'image' | 'video' | 'edit'>('image')

    const tabs = [
        { id: 'image', label: 'Image', icon: IconPhoto },
        { id: 'video', label: 'Video', icon: IconVideo },
        { id: 'edit', label: 'Edit', icon: IconPencil },
    ]

    return (
        <div className="flex h-screen flex-col bg-rp-base text-rp-text overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-rp-highlight-low px-6 h-16 shrink-0 z-20 bg-rp-base">
                <div className="flex items-center gap-6">
                    <Link
                        href="/studio"
                        className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                    >
                        <IconArrowLeft size={20} />
                        <span className="hidden sm:inline font-medium">Soul Builder</span>
                    </Link>
                    <div className="h-6 w-px bg-rp-highlight-low" />

                    {/* Tab Switcher */}
                    <nav className="flex items-center gap-1 p-1 bg-rp-surface rounded-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                    activeTab === tab.id
                                        ? "bg-rp-iris text-white shadow-lg"
                                        : "text-rp-subtle hover:text-rp-text hover:bg-rp-highlight-low/20"
                                )}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-rp-muted uppercase font-bold tracking-widest">Aether Balance</span>
                        <span className="text-rp-gold font-bold flex items-center gap-1">
                            1,250 <span className="text-xs">✧</span>
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Studio Area */}
            <main className="flex-1 overflow-hidden">
                <GenerationStudio type={activeTab} key={activeTab} />
            </main>
        </div>
    )
}
