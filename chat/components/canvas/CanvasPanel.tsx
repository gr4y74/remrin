"use client"

import { ChatbotUIContext, Artifact } from "@/context/context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    IconCode,
    IconCopy,
    IconDownload,
    IconMarkdown,
    IconMath,
    IconX
} from "@tabler/icons-react"
import { FC, useContext, useState } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface CanvasPanelProps {
    width?: number
    onClose?: () => void
}

export const CanvasPanel: FC<CanvasPanelProps> = ({
    width = 450,
    onClose
}) => {
    const { artifacts, setArtifacts, isCanvasOpen, setIsCanvasOpen } =
        useContext(ChatbotUIContext)
    const [activeArtifactId, setActiveArtifactId] = useState<string | null>(
        artifacts[0]?.id || null
    )

    const handleClose = () => {
        if (onClose) {
            onClose()
        } else {
            setIsCanvasOpen(false)
        }
    }

    const handleCloseArtifact = (id: string) => {
        setArtifacts(prev => prev.filter(a => a.id !== id))
        if (activeArtifactId === id) {
            const remaining = artifacts.filter(a => a.id !== id)
            setActiveArtifactId(remaining[0]?.id || null)
        }
    }

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content)
    }

    const handleDownload = (artifact: Artifact) => {
        const blob = new Blob([artifact.content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${artifact.title}.${artifact.language || "txt"}`
        a.click()
        URL.revokeObjectURL(url)
    }

    const getArtifactIcon = (type: Artifact["type"]) => {
        switch (type) {
            case "code":
                return IconCode
            case "markdown":
                return IconMarkdown
            case "math":
                return IconMath
            default:
                return IconCode
        }
    }

    const activeArtifact = artifacts.find(a => a.id === activeArtifactId)

    if (!isCanvasOpen || artifacts.length === 0) {
        return null
    }

    return (
        <div
            className="flex h-full shrink-0 flex-col border-l border-border/50 bg-darker-dark-blue"
            style={{ width: `${width}px` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
                <h3 className="text-sm font-medium text-foreground">Artifacts</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={handleClose}
                >
                    <IconX size={16} />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-border/50 bg-almost-black-blue/50">
                {artifacts.map(artifact => {
                    const Icon = getArtifactIcon(artifact.type)
                    return (
                        <div
                            key={artifact.id}
                            className={cn(
                                "group flex min-w-0 max-w-[180px] cursor-pointer items-center gap-2 border-r border-border/30 px-3 py-2",
                                activeArtifactId === artifact.id
                                    ? "bg-darker-dark-blue text-foreground"
                                    : "text-muted-foreground hover:bg-darker-dark-blue/50 hover:text-foreground"
                            )}
                            onClick={() => setActiveArtifactId(artifact.id)}
                        >
                            <Icon size={14} className="shrink-0" />
                            <span className="truncate text-xs">{artifact.title}</span>
                            <button
                                onClick={e => {
                                    e.stopPropagation()
                                    handleCloseArtifact(artifact.id)
                                }}
                                className="ml-auto shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                            >
                                <IconX size={12} />
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Content */}
            {activeArtifact && (
                <>
                    {/* Actions Bar */}
                    <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
                        <span className="text-xs text-muted-foreground">
                            {activeArtifact.language || activeArtifact.type}
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => handleCopy(activeArtifact.content)}
                            >
                                <IconCopy size={14} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => handleDownload(activeArtifact)}
                            >
                                <IconDownload size={14} />
                            </Button>
                        </div>
                    </div>

                    {/* Code/Content Display */}
                    <div className="flex-1 overflow-auto">
                        {activeArtifact.type === "code" ? (
                            <SyntaxHighlighter
                                language={activeArtifact.language || "plaintext"}
                                style={oneDark}
                                customStyle={{
                                    margin: 0,
                                    padding: "1rem",
                                    background: "transparent",
                                    fontSize: "13px"
                                }}
                                wrapLines
                                wrapLongLines
                            >
                                {activeArtifact.content}
                            </SyntaxHighlighter>
                        ) : (
                            <pre className="whitespace-pre-wrap p-4 text-sm text-foreground">
                                {activeArtifact.content}
                            </pre>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default CanvasPanel
