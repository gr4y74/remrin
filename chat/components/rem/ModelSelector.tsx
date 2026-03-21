"use client"

import React from 'react'
import { Cpu, ChevronDown, Check, Sparkles, Brain, Zap } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatSolo } from '../chat-solo/ChatSoloEngine'

/**
 * Claude-inspired Model Selector Pill
 * Job 6 of Rem Cockpit Upgrade
 */
export const ModelSelector: React.FC = () => {
    const { llmProvider, llmModel, setLLMConfig } = useChatSolo()

    const models = [
        {
            id: 'claude-3-5-sonnet-20241022',
            provider: 'claude',
            name: 'Claude 3.5 Sonnet',
            description: 'Most intelligent model',
            icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" />,
            color: 'text-blue-400 bg-blue-400/10'
        },
        {
            id: 'deepseek-chat',
            provider: 'deepseek',
            name: 'DeepSeek V3',
            description: 'Efficient & Precise',
            icon: <Brain className="w-3.5 h-3.5 text-primary" />,
            color: 'text-primary bg-primary/10'
        },
        {
            id: 'gemini-1.5-pro',
            provider: 'gemini',
            name: 'Gemini 1.5 Pro',
            description: 'Complex reasoning',
            icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
            color: 'text-emerald-400 bg-emerald-400/10'
        }
    ]

    const selectedModel = models.find(m => m.provider === llmProvider) || models[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    className="h-9 px-3 gap-2.5 rounded-2xl bg-muted/20 border-border/40 hover:bg-muted/40 transition-all group font-outfit"
                >
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", selectedModel.color)}>
                        {selectedModel.icon}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[11px] font-bold text-foreground leading-none tracking-wide flex items-center gap-1.5">
                            {selectedModel.name}
                            <ChevronDown size={10} className="text-muted-foreground opacity-50 group-hover:translate-y-0.5 transition-transform" />
                        </span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="start" 
                className="w-64 bg-background/95 backdrop-blur-xl border-white/5 shadow-2xl p-2 rounded-2xl animate-in fade-in zoom-in-95 duration-200"
            >
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
                    Available Models
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5 mx-2" />
                
                {models.map((model) => (
                    <DropdownMenuItem
                        key={model.id}
                        className={cn(
                            "flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all mt-1",
                            llmProvider === model.provider ? "bg-primary/5 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => setLLMConfig(model.provider as any, model.id)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border border-current/10", model.color)}>
                                {model.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold">{model.name}</span>
                                <span className="text-[10px] opacity-60 font-medium">{model.description}</span>
                            </div>
                        </div>
                        {llmProvider === model.provider && (
                            <Check className="w-4 h-4 text-primary" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
