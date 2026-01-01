"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { IconArrowLeft, IconDeviceFloppy, IconRefresh, IconAlertTriangle } from "@tabler/icons-react"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"
import TextareaAutosize from "react-textarea-autosize"
import { toast } from "sonner"

export default function UniversalConsoleEditor() {
    const [activeFile, setActiveFile] = useState<"v1" | "v2">("v2")
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        loadFile(activeFile)
    }, [activeFile])

    async function loadFile(file: "v1" | "v2") {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/admin/universal-console?file=${file}`)
            if (!res.ok) throw new Error("Failed to load file")
            const data = await res.json()
            setContent(data.content || "")
        } catch (error) {
            console.error("Error loading file:", error)
            toast.error("Failed to load console file")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSave() {
        setIsSaving(true)
        try {
            const res = await fetch("/api/admin/universal-console", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ file: activeFile, content })
            })

            if (!res.ok) throw new Error("Failed to save")
            toast.success("File saved successfully")
        } catch (error) {
            console.error("Error saving file:", error)
            toast.error("Failed to save changes")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <AdminPasswordGate>
            <div className="min-h-screen bg-rp-base text-rp-text flex flex-col">
                {/* Header */}
                <header className="border-b border-rp-highlight-med bg-rp-surface px-6 py-4 sticky top-0 z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 text-rp-subtle transition-colors hover:text-rp-text"
                            >
                                <IconArrowLeft size={20} />
                                <span className="hidden md:inline">Back</span>
                            </Link>
                            <div className="h-6 w-px bg-rp-highlight-med hidden md:block" />
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                🧠 Universal Console Editor
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex bg-rp-overlay rounded-lg p-1 border border-rp-highlight-med">
                                <button
                                    onClick={() => setActiveFile("v2")}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeFile === "v2"
                                        ? "bg-rp-iris text-white shadow-sm"
                                        : "text-rp-subtle hover:text-rp-text"
                                        }`}
                                >
                                    Console V2.0
                                </button>
                                <button
                                    onClick={() => setActiveFile("v1")}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeFile === "v1"
                                        ? "bg-rp-iris text-white shadow-sm"
                                        : "text-rp-subtle hover:text-rp-text"
                                        }`}
                                >
                                    Console V1.0
                                </button>
                            </div>

                            <button
                                onClick={() => loadFile(activeFile)}
                                className="p-2 text-rp-subtle hover:text-rp-text transition-colors rounded-lg hover:bg-rp-overlay"
                                title="Refresh"
                            >
                                <IconRefresh size={20} className={isLoading ? "animate-spin" : ""} />
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLoading}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IconDeviceFloppy size={20} />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Editor Area */}
                <main className="flex-1 relative overflow-auto">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-rp-subtle">
                            <div className="flex flex-col items-center gap-2">
                                <IconRefresh size={24} className="animate-spin" />
                                <p>Loading source code...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="min-h-full bg-[#0d1117]">
                            <TextareaAutosize
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full min-h-[calc(100vh-80px)] bg-transparent p-4 font-mono text-sm text-rp-text focus:outline-none leading-relaxed resize-none"
                                spellCheck={false}
                            />
                        </div>
                    )}
                </main>

                <div className="bg-amber-900/20 border-t border-amber-500/20 p-2 text-center text-xs text-amber-500 flex items-center justify-center gap-2">
                    <IconAlertTriangle size={14} />
                    <span>Warning: You are editing the live brain of the AI. Syntax errors may break functionality immediately.</span>
                </div>
            </div>
        </AdminPasswordGate>
    )
}
