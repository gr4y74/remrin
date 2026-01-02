"use client"

import { IconFlag, IconAlertOctagon, IconBug, IconLayout, IconLock } from "@tabler/icons-react"

interface Pillar {
    id: string
    title: string
    description: string
    noise_concentration: string
    impact: string
}

const pillarIcons: Record<string, any> = {
    'Pillar A': IconBug,
    'Pillar B': IconAlertOctagon,
    'Pillar C': IconActivity, // Fallback if not specified
    'Pillar D': IconLayout,
    'Pillar E': IconLock
}

// Fallback for missing Activity icon in my current mental imports
import { IconActivity } from "@tabler/icons-react"

export function TriageDashboard() {
    const pillars: Pillar[] = [
        {
            id: 'Pillar A',
            title: 'Loose Typed Architecture',
            description: 'Missing type definitions for core streaming primitives like ChatChunk.',
            noise_concentration: 'lib/chat-engine/providers/*',
            impact: 'High fragility during streaming.'
        },
        {
            id: 'Pillar B',
            title: 'Incomplete Gacha/Carrot Integration',
            description: 'Ghost-signed logic in API routes without library implementation.',
            noise_concentration: 'app/api/v2/chat/route.ts',
            impact: 'Prevents clean builds.'
        },
        {
            id: 'Pillar C',
            title: 'Component/Context Sync Friction',
            description: 'Mismatch between global context and component expectations in Chat-V2.',
            noise_concentration: 'components/chat-v2/ChatMessage.tsx',
            impact: 'Runtime risks and voice feature degradation.'
        },
        {
            id: 'Pillar D',
            title: 'UI Redesign "Half-Life"',
            description: 'Massive Tailwind ordering noise (approx 10k warnings).',
            noise_concentration: 'app/[locale]/...',
            impact: 'Extreme developer friction and lint fatigue.'
        },
        {
            id: 'Pillar E',
            title: 'Permissive Admin/Auth Layers',
            description: 'Inconsistent authentication checks across admin modules.',
            noise_concentration: 'app/api/admin/*',
            impact: 'Security risk.'
        }
    ]

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => {
                const Icon = pillarIcons[pillar.id] || IconFlag
                return (
                    <div key={pillar.id} className="bg-rp-surface border-rp-muted/20 flex flex-col rounded-2xl border p-6 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="bg-rp-overlay flex size-12 items-center justify-center rounded-xl">
                                <Icon size={28} className="text-rp-rose" />
                            </div>
                            <span className="text-rp-muted text-[10px] font-bold uppercase tracking-widest">{pillar.id}</span>
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-rp-text leading-tight">{pillar.title}</h3>
                        <p className="text-rp-subtle mb-4 text-xs italic leading-relaxed">{pillar.description}</p>
                        <div className="mt-auto space-y-2 pt-4 border-t border-rp-highlight-low">
                            <div className="flex flex-col gap-1">
                                <span className="text-rp-muted text-[10px] uppercase font-black tracking-tighter">Noise Concentration:</span>
                                <code className="text-rp-iris bg-rp-base w-fit rounded px-2 py-0.5 font-mono text-[10px]">{pillar.noise_concentration}</code>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-rp-muted text-[10px] uppercase font-black tracking-tighter">Impact:</span>
                                <span className="text-rp-love text-[10px] font-bold uppercase">{pillar.impact}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
