"use client"

import React, { useState, useEffect } from 'react'
import { createHighlighter } from 'shiki'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
    code: string
    language: string
}

// Global highlighter instance to avoid re-creation
// We use a promise to ensure only one initialization happens
let highlighterPromise: Promise<any> | null = null

/**
 * Shiki-powered Syntax Highlighted Code Block
 * Job 3 of Rem Cockpit Upgrade
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
    const [html, setHtml] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const init = async () => {
            try {
                if (!highlighterPromise) {
                    highlighterPromise = createHighlighter({
                        themes: ['github-dark'],
                        langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'html', 'css', 'markdown', 'sql', 'yaml', 'jsx', 'tsx']
                    })
                }
                
                const highlighter = await highlighterPromise
                const supportedLangs = highlighter.getLoadedLanguages()
                
                // Map 'react' to 'tsx' or 'jsx'
                let lang = language.toLowerCase()
                if (lang === 'react') lang = 'tsx'
                if (!supportedLangs.includes(lang)) lang = 'text'

                const highlighted = highlighter.codeToHtml(code, {
                    lang,
                    theme: 'github-dark'
                })
                setHtml(highlighted)
            } catch (err) {
                console.error('Shiki highlight failed:', err)
                setHtml('') // Fallback to plain text via render logic
            }
        }

        init()
    }, [code, language])

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="my-8 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d1117] group/code transition-all duration-300">
            {/* Header */}
            <div className="bg-[#161b22] px-4 py-2.5 border-b border-white/5 flex justify-between items-center select-none">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] font-mono">
                    {language || 'text'}
                </span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-all uppercase tracking-widest"
                >
                    {copied ? (
                        <span className="text-secondary animate-in fade-in zoom-in-95 duration-200 font-bold">Copied!</span>
                    ) : (
                        <span>Copy</span>
                    )}
                </button>
            </div>

            {/* Code Content Area */}
            <div className="relative overflow-x-auto p-5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {html ? (
                    <div 
                        dangerouslySetInnerHTML={{ __html: html }} 
                        className="[&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:!m-0 [&>pre>code]:!bg-transparent text-[13px] leading-relaxed font-mono selection:bg-primary/20"
                    />
                ) : (
                    <pre className="text-[13px] leading-relaxed font-mono opacity-50">
                        <code>{code}</code>
                    </pre>
                )}
            </div>
        </div>
    )
}
