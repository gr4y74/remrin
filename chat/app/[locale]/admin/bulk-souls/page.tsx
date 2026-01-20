"use client"

import { useState, useRef, useCallback } from "react"
import Link from "next/link"
import {
    IconArrowLeft,
    IconUpload,
    IconFileDescription,
    IconReload,
    IconCheck,
    IconX,
    IconTrash,
    IconPhoto,
    IconAlertCircle

} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AdminPasswordGate } from "@/components/admin/AdminPasswordGate"
import { toast } from "sonner"

interface PendingSoul {
    id: string
    name: string
    data: Record<string, unknown>
    status: 'pending' | 'importing' | 'success' | 'error'
    error?: string
}

export default function BulkSoulsPage() {
    const [pendingSouls, setPendingSouls] = useState<PendingSoul[]>([])
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Handle file selection
    const processFiles = useCallback(async (files: FileList | File[]) => {
        const newSouls: PendingSoul[] = []

        for (const file of Array.from(files)) {
            if (!file.name.endsWith('.json')) {
                toast.error(`Skipped ${file.name}: not a JSON file`)
                continue
            }

            try {
                const content = await file.text()
                const data = JSON.parse(content)

                // Clean up template fields
                const cleanedData = { ...data }
                delete cleanedData.$schema
                delete cleanedData._comment
                delete cleanedData._safety_level_options
                delete cleanedData._category_options
                delete cleanedData._voice_id_comment
                delete cleanedData._image_url_comment
                delete cleanedData._exported_at
                delete cleanedData._source_id

                if (!cleanedData.name || !cleanedData.system_prompt) {
                    toast.error(`Skipped ${file.name}: missing required fields (name, system_prompt)`)
                    continue
                }

                newSouls.push({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: cleanedData.name,
                    data: cleanedData,
                    status: 'pending'
                })
            } catch (e) {
                toast.error(`Failed to parse ${file.name}`)
            }
        }

        setPendingSouls(prev => [...prev, ...newSouls])
    }, [])

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files)
            e.target.value = ''
        }
    }

    // Remove a soul from the queue
    const removeSoul = (id: string) => {
        setPendingSouls(prev => prev.filter(s => s.id !== id))
    }

    // Clear all pending souls
    const clearAll = () => {
        setPendingSouls([])
    }

    // Import all pending souls
    const importAll = async () => {
        if (pendingSouls.length === 0) return

        setIsImporting(true)
        const total = pendingSouls.length
        let completed = 0

        for (const soul of pendingSouls) {
            setPendingSouls(prev =>
                prev.map(s => s.id === soul.id ? { ...s, status: 'importing' } : s)
            )

            try {
                const response = await fetch('/api/v2/personas/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ personas: [soul.data] })
                })

                const result = await response.json()

                if (!response.ok || result.failed > 0) {
                    throw new Error(result.errors?.[0] || 'Import failed')
                }

                setPendingSouls(prev =>
                    prev.map(s => s.id === soul.id ? { ...s, status: 'success' } : s)
                )
            } catch (error: any) {
                setPendingSouls(prev =>
                    prev.map(s => s.id === soul.id ? { ...s, status: 'error', error: error.message } : s)
                )
            }

            completed++
            setImportProgress(Math.round((completed / total) * 100))
        }

        setIsImporting(false)

        const successCount = pendingSouls.filter(s => s.status === 'success').length
        toast.success(`Imported ${successCount}/${total} souls`)
    }

    // Download template
    const downloadTemplate = () => {
        window.open('/templates/soul_template.json', '_blank')
    }

    const pendingCount = pendingSouls.filter(s => s.status === 'pending').length
    const successCount = pendingSouls.filter(s => s.status === 'success').length
    const errorCount = pendingSouls.filter(s => s.status === 'error').length

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
                            📦 Bulk Soul Creator
                        </h1>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl p-6 space-y-6">
                    {/* Instructions */}
                    <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-4">
                        <h2 className="font-semibold text-rp-text mb-2">Quick Start</h2>
                        <ol className="text-sm text-rp-subtle space-y-1 list-decimal list-inside">
                            <li>Download the template JSON file</li>
                            <li>Copy and customize for each Soul you want to create</li>
                            <li>Drag and drop all JSON files here (or click to browse)</li>
                            <li>Review and click &quot;Import All&quot;</li>
                        </ol>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadTemplate}
                            className="mt-3 border-rp-foam/50 text-rp-foam hover:bg-rp-foam/10"
                        >
                            <IconFileDescription className="mr-2 h-4 w-4" />
                            Download Template
                        </Button>
                    </div>

                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all
                            ${isDragging
                                ? 'border-rp-iris bg-rp-iris/10'
                                : 'border-rp-highlight-med bg-rp-surface hover:border-rp-iris/50'
                            }
                        `}
                    >
                        <IconUpload size={48} className="mx-auto text-rp-muted mb-4" />
                        <p className="text-rp-text font-medium">
                            Drop JSON files here or click to browse
                        </p>
                        <p className="text-sm text-rp-subtle mt-1">
                            Supports multiple files at once
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            multiple
                            className="hidden"
                        />
                    </div>

                    {/* Queue */}
                    {pendingSouls.length > 0 && (
                        <div className="rounded-xl border border-rp-highlight-med bg-rp-surface p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-rp-text">
                                    Import Queue ({pendingSouls.length})
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearAll}
                                        disabled={isImporting}
                                        className="text-rp-muted hover:text-rp-text"
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={importAll}
                                        disabled={isImporting || pendingCount === 0}
                                        className="bg-gradient-to-r from-rp-iris to-rp-foam text-white"
                                    >
                                        {isImporting ? (
                                            <>
                                                <IconReload className="mr-2 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <IconUpload className="mr-2 h-4 w-4" />
                                                Import All ({pendingCount})
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {isImporting && (
                                <div className="space-y-1">
                                    <Progress value={importProgress} className="h-2" />
                                    <p className="text-xs text-rp-subtle text-right">{importProgress}%</p>
                                </div>
                            )}

                            {/* Stats */}
                            {(successCount > 0 || errorCount > 0) && (
                                <div className="flex gap-4 text-sm">
                                    {successCount > 0 && (
                                        <span className="text-green-400">✓ {successCount} imported</span>
                                    )}
                                    {errorCount > 0 && (
                                        <span className="text-red-400">✗ {errorCount} failed</span>
                                    )}
                                </div>
                            )}

                            {/* Soul List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {pendingSouls.map(soul => (
                                    <div
                                        key={soul.id}
                                        className={`
                                            flex items-center justify-between rounded-lg border p-3
                                            ${soul.status === 'success' ? 'border-green-500/30 bg-green-500/10' :
                                                soul.status === 'error' ? 'border-red-500/30 bg-red-500/10' :
                                                    soul.status === 'importing' ? 'border-rp-iris/30 bg-rp-iris/10' :
                                                        'border-rp-highlight-med bg-rp-overlay'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {soul.status === 'pending' && <IconPhoto size={20} className="text-rp-muted" />}
                                            {soul.status === 'importing' && <IconReload size={20} className="text-rp-iris animate-spin" />}
                                            {soul.status === 'success' && <IconCheck size={20} className="text-green-400" />}
                                            {soul.status === 'error' && <IconAlertCircle size={20} className="text-red-400" />}
                                            <div>
                                                <p className="font-medium text-rp-text">{soul.name}</p>
                                                {soul.error && (
                                                    <p className="text-xs text-red-400">{soul.error}</p>
                                                )}
                                            </div>
                                        </div>
                                        {soul.status === 'pending' && (
                                            <button
                                                onClick={() => removeSoul(soul.id)}
                                                className="text-rp-muted hover:text-red-400 transition-colors"
                                            >
                                                <IconTrash size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AdminPasswordGate>
    )
}
