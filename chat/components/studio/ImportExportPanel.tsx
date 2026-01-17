"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { IconDownload, IconUpload, IconReload, IconFileDescription, IconSparkles } from "@tabler/icons-react"
import { toast } from "sonner"

interface ImportExportPanelProps {
    className?: string
}

export function ImportExportPanel({ className }: ImportExportPanelProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const bulkFileInputRef = useRef<HTMLInputElement>(null)
    const singleFileInputRef = useRef<HTMLInputElement>(null)

    // Download blank template
    const handleDownloadTemplate = () => {
        window.open('/templates/soul_template.json', '_blank')
        toast.success('Template downloaded!', {
            description: 'Edit the JSON file and import it to create your Soul.'
        })
    }

    // Export all user's personas
    const handleExport = async () => {
        setIsExporting(true)
        try {
            const response = await fetch("/api/v2/personas/export")
            if (!response.ok) throw new Error("Export failed")

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            const fileName = response.headers.get("Content-Disposition")?.split("filename=")[1]?.replace(/"/g, "") || "personas_backup.json"

            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success("Personas exported successfully")
        } catch (error: any) {
            console.error("Export error:", error)
            toast.error(`Export failed: ${error.message}`)
        } finally {
            setIsExporting(false)
        }
    }

    // Bulk import (existing functionality)
    const handleBulkImportClick = () => {
        bulkFileInputRef.current?.click()
    }

    // Single soul quick import
    const handleSingleImportClick = () => {
        singleFileInputRef.current?.click()
    }

    // Process bulk import file
    const handleBulkFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setImportProgress(10)

        try {
            const content = await file.text()
            const data = JSON.parse(content)

            setImportProgress(30)

            const response = await fetch("/api/v2/personas/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            setImportProgress(80)

            const result = await response.json()

            if (!response.ok) throw new Error(result.error || "Import failed")

            setImportProgress(100)
            toast.success(`Import complete: ${result.success} succeeded, ${result.failed} failed`)

            if (result.errors?.length > 0) {
                result.errors.forEach((err: string) => console.warn("Import warning:", err))
            }

            if (bulkFileInputRef.current) bulkFileInputRef.current.value = ""
        } catch (error: any) {
            toast.error(`Import failed: ${error.message}`)
        } finally {
            setTimeout(() => {
                setIsImporting(false)
                setImportProgress(0)
            }, 500)
        }
    }

    // Process single soul import
    const handleSingleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setImportProgress(20)

        try {
            const content = await file.text()
            const personaData = JSON.parse(content)

            // Remove internal fields
            delete personaData._exported_at
            delete personaData._source_id
            delete personaData.$schema
            delete personaData._comment
            delete personaData._safety_level_options
            delete personaData._category_options
            delete personaData._voice_id_comment
            delete personaData._image_url_comment

            setImportProgress(50)

            // Wrap in personas array for the import API
            const response = await fetch("/api/v2/personas/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personas: [personaData] })
            })

            setImportProgress(90)

            const result = await response.json()

            if (!response.ok) throw new Error(result.error || "Import failed")

            setImportProgress(100)

            if (result.success > 0) {
                toast.success(`Soul "${personaData.name}" imported successfully!`, {
                    description: 'You can now edit it in the Studio.'
                })
            } else {
                toast.error(`Failed to import: ${result.errors?.[0] || 'Unknown error'}`)
            }

            if (singleFileInputRef.current) singleFileInputRef.current.value = ""
        } catch (error: any) {
            toast.error(`Import failed: ${error.message}`)
        } finally {
            setTimeout(() => {
                setIsImporting(false)
                setImportProgress(0)
            }, 500)
        }
    }

    return (
        <div className={`space-y-4 rounded-xl border border-rp-highlight-med bg-rp-surface p-4 ${className}`}>
            {/* Quick Import Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-rp-text flex items-center gap-2">
                        <IconSparkles size={20} className="text-rp-gold" />
                        Quick Soul Import
                    </h3>
                    <p className="text-sm text-rp-subtle">
                        Download a template, edit it, and import directly — no forge required.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="border-rp-foam/50 text-rp-foam hover:bg-rp-foam/10"
                    >
                        <IconFileDescription className="mr-2 h-4 w-4" />
                        Get Template
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSingleImportClick}
                        disabled={isImporting}
                        className="bg-gradient-to-r from-rp-iris to-rp-foam text-white hover:opacity-90"
                    >
                        {isImporting ? (
                            <IconReload className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <IconUpload className="mr-2 h-4 w-4" />
                        )}
                        Import Soul
                    </Button>
                    <input
                        type="file"
                        ref={singleFileInputRef}
                        onChange={handleSingleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </div>

            <div className="h-px bg-rp-highlight-med" />

            {/* Backup & Migration Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-rp-text">Backup & Migration</h3>
                    <p className="text-sm text-rp-subtle">Export all your Souls or import from a backup file.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting || isImporting}
                        className="border-rp-highlight-med bg-rp-overlay/50 hover:bg-rp-highlight-low"
                    >
                        {isExporting ? (
                            <IconReload className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <IconDownload className="mr-2 h-4 w-4" />
                        )}
                        Export All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkImportClick}
                        disabled={isExporting || isImporting}
                        className="border-rp-highlight-med bg-rp-overlay/50 hover:bg-rp-highlight-low"
                    >
                        {isImporting ? (
                            <IconReload className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <IconUpload className="mr-2 h-4 w-4" />
                        )}
                        Bulk Import
                    </Button>
                    <input
                        type="file"
                        ref={bulkFileInputRef}
                        onChange={handleBulkFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </div>

            {isImporting && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-rp-subtle">
                        <span>Importing...</span>
                        <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-1 bg-rp-highlight-low" />
                </div>
            )}
        </div>
    )
}
