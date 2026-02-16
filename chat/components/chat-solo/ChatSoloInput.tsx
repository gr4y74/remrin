"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Plus, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useChatSolo } from './ChatSoloEngine'
import { Button } from '@/components/ui/button'

export const ChatSoloInput: React.FC = () => {
    const [input, setInput] = useState('')
    const { sendMessage, isGenerating } = useChatSolo()
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = async () => {
        if (!input.trim() || isGenerating) return
        const content = input.trim()
        setInput('')
        await sendMessage(content)
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
        <div className="w-full max-w-3xl mx-auto px-6 pb-6">
            <div className="relative group p-0 rounded-2xl transition-all duration-500 bg-transparent shadow-2xl ring-1 ring-white/5 focus-within:ring-white/10">
                <div className="relative flex flex-col w-full bg-background/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Speak to Rem"
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-foreground placeholder:text-muted-foreground/50 px-5 pt-4 pb-12 resize-none min-h-[60px] max-h-[400px] text-base leading-relaxed font-sans"
                        rows={1}
                    />

                    <div className="absolute bottom-2.5 left-4 flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl" title="Attach context">
                            <Plus className="w-5 h-5" />
                        </Button>
                        <div className="h-4 w-px bg-white/5 mx-1" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2 opacity-50">
                            {isGenerating && "Synthesizing..."}
                        </span>
                    </div>

                    <div className="absolute bottom-2.5 right-4 flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1.5 font-medium opacity-40">
                            Press Enter
                        </span>
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isGenerating}
                            className={cn(
                                "h-9 w-9 rounded-xl transition-all shadow-md flex items-center justify-center p-0",
                                input.trim() && !isGenerating
                                    ? "bg-primary text-primary-foreground hover:opacity-90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                            title="Send message"
                        >
                            <ArrowUp className="w-5 h-5" />
                        </Button>
                    </div>

                    {isGenerating && (
                        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary overflow-hidden">
                            <div className="h-full w-full bg-white/20 animate-progress-shimmer" />
                        </div>
                    )}
                </div>
            </div>
            <p className="mt-4 text-[10px] text-center text-muted-foreground/40 font-medium tracking-wider uppercase">
                AI may display inaccurate info. Please verify important details.
            </p>
        </div>
    )
}
