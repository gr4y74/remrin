"use client"

import React, { useState, useEffect } from 'react'
import { X, Copy, Download, Code, Layout, Languages, FileText, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createHighlighter } from 'shiki'
import { MarkdownRenderer } from '../rem/MarkdownRenderer'

interface ArtifactsPanelProps {
    isOpen: boolean
    onClose: () => void
    content: string | null
}

let highlighterPromise: Promise<any> | null = null

/**
 * Claude-inspired Artifact Panel (The Canvas)
 * Job 5 of Rem Cockpit Upgrade
 */
export const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({ isOpen, onClose, content }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'markdown'>('preview')
    const [highlightedHtml, setHighlightedHtml] = useState('')
    const [copied, setCopied] = useState(false)

    // Detect if content is HTML/SVG for preview
    const isWebable = content?.trim().startsWith('<') || content?.trim().startsWith('<!DOCTYPE') || content?.toLowerCase().includes('<html>') || content?.trim().startsWith('<svg')

    useEffect(() => {
        if (content && activeTab === 'code') {
            const highlight = async () => {
                try {
                    if (!highlighterPromise) {
                        highlighterPromise = createHighlighter({
                            themes: ['github-dark'],
                            langs: ['html', 'css', 'javascript', 'typescript', 'tsx', 'markdown', 'python', 'json', 'svg']
                        })
                    }
                    const highlighter = await highlighterPromise
                    
                    let lang = isWebable ? 'html' : 'typescript'
                    if (content?.toLowerCase().includes('import react') || content?.toLowerCase().includes('export default function')) {
                        lang = 'tsx'
                    }

                    const html = highlighter.codeToHtml(content, {
                        lang,
                        theme: 'github-dark'
                    })
                    setHighlightedHtml(html)
                } catch (err) {
                    console.error('Shiki highlight failed:', err)
                }
            }
            highlight()
        }
    }, [content, activeTab, isWebable])

    // Effect to toggle default tab based on content
    useEffect(() => {
        if (content) {
            if (isWebable) setActiveTab('preview')
            else setActiveTab('code')
        }
    }, [content, isWebable])

    if (!isOpen) return null

    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleDownload = () => {
        if (!content) return
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `artifact-${Date.now()}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <aside className={cn(
            "fixed inset-y-0 right-0 z-50 w-full md:w-[650px] bg-background border-l border-white/5 transition-transform duration-500 ease-out transform flex flex-col shadow-[-20px_0_50px_-12px_rgba(0,0,0,0.5)]",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-14 border-b border-white/5 bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Languages className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground font-outfit uppercase tracking-widest">Visualizer</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-muted rounded-xl h-9 w-9">
                    <X className="w-4 h-4 text-muted-foreground" />
                </Button>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-card/10">
                <div className="flex gap-1">
                    <TabButton 
                        active={activeTab === 'preview'} 
                        onClick={() => setActiveTab('preview')} 
                        icon={<Layout className="w-3.5 h-3.5" />} 
                        label="Preview" 
                        disabled={!isWebable}
                    />
                    <TabButton 
                        active={activeTab === 'code'} 
                        onClick={() => setActiveTab('code')} 
                        icon={<Code className="w-3.5 h-3.5" />} 
                        label="Code" 
                    />
                    <TabButton 
                        active={activeTab === 'markdown'} 
                        onClick={() => setActiveTab('markdown')} 
                        icon={<FileText className="w-3.5 h-3.5" />} 
                        label="Markdown" 
                    />
                </div>
                
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Main Content Viewport */}
            <div className="flex-1 overflow-hidden bg-[#0d1117] relative">
                {!content ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4">
                        <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-white/5 flex items-center justify-center">
                             <Layout className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] font-outfit">Waiting for Artifact...</p>
                    </div>
                ) : (
                    <div className="h-full w-full overflow-auto custom-scrollbar">
                        {activeTab === 'preview' && isWebable && (
                            <iframe
                                srcDoc={content}
                                title="Artifact Preview"
                                className="w-full h-full bg-white border-none"
                                sandbox="allow-scripts"
                            />
                        )}
                        
                        {activeTab === 'code' && (
                            <div className="p-8">
                                {highlightedHtml ? (
                                    <div 
                                        dangerouslySetInnerHTML={{ __html: highlightedHtml }} 
                                        className="[&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:!m-0 text-[13px] leading-relaxed font-mono selection:bg-primary/30"
                                    />
                                ) : (
                                    <pre className="font-mono text-xs opacity-50 whitespace-pre-wrap">{content}</pre>
                                )}
                            </div>
                        )}

                        {activeTab === 'markdown' && (
                            <div className="p-10 bg-background min-h-full">
                                <MarkdownRenderer content={content} />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    )
}

const TabButton = ({ active, onClick, icon, label, disabled = false }: any) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
            "px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
            active 
                ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-3px_rgba(var(--primary),0.3)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
            disabled && "opacity-30 cursor-not-allowed"
        )}
    >
        {icon}
        {label}
    </button>
)
