"use client"

import React from 'react'
import { FileText, X, FileCode, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileCardProps {
    name: string
    type: string
    onRemove: () => void
}

/**
 * Claude-inspired File Preview Card
 * Job 7 of Rem Cockpit Upgrade
 */
export const FileCard: React.FC<FileCardProps> = ({ name, type, onRemove }) => {
    const isCode = type.includes('javascript') || type.includes('typescript') || type.includes('python') || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.py')
    const isImage = type.includes('image')

    return (
        <div className="group relative flex items-center gap-3 bg-muted/30 border border-white/5 backdrop-blur-md px-4 py-3 rounded-2xl w-full max-w-[240px] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center border",
                isCode ? "bg-rp-iris/10 border-rp-iris/20 text-rp-iris" : 
                isImage ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                "bg-primary/10 border-primary/20 text-primary"
            )}>
                {isCode ? <FileCode className="w-5 h-5" /> : 
                 isImage ? <FileImage className="w-5 h-5" /> : 
                 <FileText className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0 pr-6">
                <p className="text-[12px] font-bold text-foreground truncate select-none">{name}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider opacity-60 truncate">
                    {isCode ? 'Code' : isImage ? 'Image' : 'Document'}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onRemove()
                }}
                title="Remove file"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
                <X className="w-3 h-3" />
            </button>
        </div>
    )
}
