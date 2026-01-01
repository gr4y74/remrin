"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { IconDownload, IconUpload, IconReload, IconCheck, IconAlertCircle } from "@tabler/icons-react"
import { toast } from "sonner"

interface ImportExportPanelProps {
    className?: string
}

export function ImportExportPanel({ className }: ImportExportPanelProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setImportProgress(10)

        try {
            const reader = new FileReader()
            reader.onload = async (e) => {
                try {
                    const content = e.target?.result as string
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

                    if (result.errors.length > 0) {
                        result.errors.forEach((err: string) => console.warn("Import warning:", err))
                    }

                    // Reset input
                    if (fileInputRef.current) fileInputRef.current.value = ""

                    // Optional: Refresh page or trigger a reload of the list
                    // window.location.reload()
                } catch (error: any) {
                    toast.error(`Import failed: ${error.message}`)
                } finally {
                    setTimeout(() => {
                        setIsImporting(false)
                        setImportProgress(0)
                    }, 500)
                }
            }
            reader.readAsText(file)
        } catch (error: any) {
            toast.error(`Failed to read file: ${error.message}`)
            setIsImporting(false)
            setImportProgress(0)
        }
    }

    return (
        <div className={`space-y-4 rounded-xl border border-rp-highlight-med bg-rp-surface p-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-rp-text">Backup & Migration</h3>
                    <p className="text-sm text-rp-subtle">Export your Souls or import them from a backup file.</p>
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
                        Export
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleImportClick}
                        disabled={isExporting || isImporting}
                        className="bg-rp-iris text-white hover:bg-rp-iris/90"
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
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                </div>
            </div>

            {isImporting && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-rp-subtle">
                        <span>Importing Souls...</span>
                        <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-1 bg-rp-highlight-low" />
                </div>
            )}
        </div>
    )
}
