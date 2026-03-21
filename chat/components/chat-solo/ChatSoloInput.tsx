"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Send, X, FileText, Paperclip, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSolo } from './ChatSoloEngine'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { FileCard } from '../rem/FileCard'

export function ChatSoloInput() {
    const [input, setInput] = useState('')
    const {
        sendMessage,
        isGenerating,
        uploadedFiles,
        addUploadedFile,
        updateUploadedFile,
        removeUploadedFile,
        engineId
    } = useChatSolo()
    
    useEffect(() => {
        console.log(`🔌 [ChatInput] Connected to Engine:${engineId}`)
    }, [engineId])
    const { user } = useAuth()
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSend = async () => {
        if ((!input.trim() && uploadedFiles.length === 0) || isGenerating) return
        const content = input.trim()
        setInput('')
        await sendMessage(content)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files
        if (!selectedFiles) return

        console.log(`[ChatInput] Processing ${selectedFiles.length} files optimistically...`)

        for (const file of Array.from(selectedFiles)) {
            const temp_id = `${Math.random().toString(36).substring(2)}_${Date.now()}`
            
            // 1. Read locally IMMEDIATELY (Job 7 / Claude style)
            const reader = new FileReader()
            reader.onload = async (event) => {
                const content = event.target?.result as string
                
                // Add to UI immediately so user sees it "attached"
                addUploadedFile({
                    temp_id,
                    name: file.name,
                    type: file.type,
                    content: content,
                    storagePath: undefined // Initially local-only
                })

                // 2. Background upload to Storage (Persistent v2)
                try {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${temp_id}.${fileExt}`
                    const filePath = `${user?.id || 'anonymous'}/${fileName}`
                    
                    const { data, error } = await supabase.storage
                        .from('chat-attachments')
                        .upload(filePath, file)
                    
                    if (data?.path) {
                        // Success! Update the file in state with the storage path
                        updateUploadedFile(temp_id, { storagePath: data.path })
                    } else if (error) {
                        console.warn('[ChatInput] Background storage upload failed, staying local-only:', error)
                    }
                } catch (err) {
                    console.error('[ChatInput] Background storage error:', err)
                }
            }
            reader.readAsText(file)
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'px'
            const scrollHeight = textareaRef.current.scrollHeight
            textareaRef.current.style.height = `${Math.min(scrollHeight, 400)}px`
        }
    }, [input])

    return (
        <div className="w-full max-w-4xl mx-auto px-6 pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* File Preview Area */}
            {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4 px-2">
                    {uploadedFiles.map((file, index) => (
                        <FileCard 
                            key={`${file.name}-${index}`}
                            name={file.name}
                            type={file.type}
                            onRemove={() => removeUploadedFile(index)}
                        />
                    ))}
                </div>
            )}

            <div className="relative group p-0 rounded-2xl transition-all duration-500 bg-transparent shadow-2xl ring-1 ring-white/5 focus-within:ring-primary/20">
                <div className="relative flex flex-col w-full bg-background/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        multiple 
                        className="hidden" 
                        title="Upload files" 
                        placeholder="Upload files"
                    />
                    
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Speak to Rem"
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground/50 px-5 pt-4 pb-14 resize-none min-h-[70px] max-h-[400px] text-base leading-relaxed font-sans"
                        rows={1}
                    />

                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => {
                                e.preventDefault()
                                fileInputRef.current?.click()
                            }}
                            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors" 
                            title="Attach context"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                        <div className="h-4 w-px bg-white/5 mx-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-50 select-none">
                            {isGenerating ? "Synthesizing..." : "Context Engine"}
                        </span>
                    </div>

                    <div className="absolute bottom-3 right-4 flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1.5 font-bold uppercase tracking-widest opacity-30 select-none">
                            Enter
                        </span>
                        <Button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                handleSend()
                            }}
                            disabled={(!input.trim() && uploadedFiles.length === 0) || isGenerating}
                            className={cn(
                                "h-9 w-9 rounded-xl transition-all shadow-md flex items-center justify-center p-0",
                                (input.trim() || uploadedFiles.length > 0) && !isGenerating
                                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                            title="Send message"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary/20 overflow-hidden">
                        <div className={cn(
                            "h-full bg-primary transition-all duration-500",
                            isGenerating ? "w-full animate-pulse" : "w-0"
                        )} />
                    </div>
                </div>
            </div>
            <p className="mt-4 text-[10px] text-center text-muted-foreground/40 font-medium tracking-wider uppercase">
                AI may display inaccurate info. Please verify important details.
            </p>
        </div>
    )
}
