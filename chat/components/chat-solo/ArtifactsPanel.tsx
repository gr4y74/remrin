"use client"

import React, { useState } from 'react'
import { X, Copy, Download, Code, Layout } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ArtifactsPanelProps {
    isOpen: boolean
    onClose: () => void
    content: string | null
}

export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ isOpen, onClose, content }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview')

    if (!isOpen) return null

    return (
        <aside className={cn(
            "fixed inset-y-0 right-0 z-40 w-full md:w-[600px] bg-background border-l border-border transition-transform duration-300 ease-in-out transform flex flex-col shadow-2xl",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-border">
                <h3 className="font-semibold text-foreground">Artifact</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted">
                    <X className="w-5 h-5 text-muted-foreground" />
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-6 py-4 border-b border-border bg-card/30">
                <button
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        activeTab === 'preview' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    <Layout className="w-4 h-4" />
                    Preview
                </button>
                <button
                    onClick={() => setActiveTab('code')}
                    className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                        activeTab === 'code' ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted"
                    )}
                >
                    <Code className="w-4 h-4" />
                    Code
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 bg-background">
                {content ? (
                    <div className="h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                        {activeTab === 'preview' ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground font-serif p-8 text-center italic">
                                [ Live Visualization Engine Rendering... ]
                            </div>
                        ) : (
                            <pre className="flex-1 p-6 font-mono text-sm overflow-auto text-foreground">
                                {content}
                            </pre>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                        <Layout className="w-12 h-12 opacity-20" />
                        <p className="text-sm">No artifact content detected.</p>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 px-6 border-top border-border flex gap-3">
                <Button variant="outline" className="flex-1 gap-2 rounded-xl" onClick={() => { }}>
                    <Copy className="w-4 h-4" />
                    Copy
                </Button>
                <Button className="flex-1 gap-2 rounded-xl bg-primary hover:opacity-90" onClick={() => { }}>
                    <Download className="w-4 h-4" />
                    Download
                </Button>
            </div>
        </aside>
    )
}
