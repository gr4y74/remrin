"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'
import { CodeBlock } from './CodeBlock'
import { ArtifactReference } from './ArtifactReference'

interface MarkdownRendererProps {
    content: string
    className?: string
}

/**
 * Claude-inspired Markdown Renderer
 * Job 1 & 3 & 5 of Rem Cockpit Upgrade
 */
export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            className={cn(
                "prose prose-sm dark:prose-invert max-w-none transition-all duration-500",
                "prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-foreground/90 prose-p:mb-6",
                "prose-headings:font-outfit prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-headings:mb-4 prose-headings:mt-8",
                "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
                "prose-blockquote:border-l-[3px] prose-blockquote:border-rp-iris/50 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:my-7 prose-blockquote:bg-muted/5",
                "prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-ul:mb-6",
                "prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2 prose-ol:mb-6",
                "prose-li:text-[15px] prose-li:my-1",
                "prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm shadow-sm rounded-lg overflow-hidden",
                "prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-muted/40 prose-th:text-left prose-th:font-semibold prose-th:text-foreground",
                "prose-td:border prose-td:border-border prose-td:p-3 prose-td:text-foreground/80",
                "prose-tr:even:bg-muted/10",
                "prose-a:text-rp-iris dark:prose-a:text-rp-iris prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-4 transition-all",
                "prose-code:font-mono prose-code:text-[0.85em] prose-code:bg-muted/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:text-rp-iris dark:prose-code:text-rp-iris",
                "prose-pre:bg-transparent prose-pre:m-0 prose-pre:p-0",
                "prose-hr:my-10 prose-hr:border-border/60",
                className
            )}
            components={{
                code({ inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '')
                    const lang = match ? match[1] : 'text'
                    const codeContent = String(children).replace(/\n$/, '')
                    
                    // Artifact Detection Logic:
                    // If it's HTML/SVG and sufficiently complex, render a reference card
                    const isArtifact = (lang === 'html' || lang === 'svg' || (inline === false && codeContent.includes('<svg'))) && codeContent.length > 100

                    if (!inline && isArtifact) {
                        return (
                            <ArtifactReference 
                                title={codeContent.match(/<title>(.*?)<\/title>/)?.[1] || "Visual Artifact"} 
                                type="web" 
                                content={codeContent}
                            />
                        )
                    }

                    return !inline ? (
                         <CodeBlock value={codeContent} language={lang} />
                    ) : (
                        <code className={cn("bg-muted/40 px-1.5 py-0.5 rounded text-[0.85em] font-mono text-rp-iris dark:text-rp-iris", className)} {...props}>
                            {children}
                        </code>
                    )
                }
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
