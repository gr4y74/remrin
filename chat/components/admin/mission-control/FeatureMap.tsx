"use client"

import { useState } from "react"
import {
    IconLayersIntersect,
    IconCheck,
    IconAlertTriangle,
    IconClock,
    IconInfoCircle,
    IconCode,
    IconTerminal2,
    IconX,
    IconCopy
} from "@tabler/icons-react"

interface Feature {
    name: string
    status: string
    description: string
    objective: string
    core_logic: string[]
    docs: string[]
    agent_advice: string
    unfinished_tasks?: string
    fix_command?: {
        mission: string
        instruction: string
    }
}

interface FeatureManifest {
    waves: {
        [key: string]: {
            features: Feature[]
        }
    }
}

export function FeatureMap({ manifest }: { manifest: FeatureManifest }) {
    const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

    return (
        <div className="space-y-8">
            {Object.entries(manifest.waves).map(([waveName, wave]) => (
                <div key={waveName} className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-rp-iris">
                        <IconLayersIntersect size={20} />
                        {waveName}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {wave.features.map((feature) => (
                            <div
                                key={feature.name}
                                onClick={() => setSelectedFeature(feature)}
                                className="bg-rp-surface border-rp-muted/20 group relative cursor-pointer overflow-hidden rounded-xl border p-5 transition-all hover:border-rp-iris/50 hover:bg-rp-overlay"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-bold text-rp-text group-hover:text-rp-iris transition-colors">{feature.name}</h4>
                                    <StatusBadge status={feature.status} />
                                </div>

                                <p className="text-rp-subtle mb-4 line-clamp-2 text-xs leading-relaxed">
                                    {feature.description}
                                </p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex gap-1">
                                        {feature.core_logic.slice(0, 2).map(file => (
                                            <span key={file} className="bg-rp-base text-rp-muted rounded-md px-1.5 py-0.5 font-mono text-[9px]">
                                                {file.split('/').pop()}
                                            </span>
                                        ))}
                                    </div>
                                    <IconInfoCircle size={14} className="text-rp-muted group-hover:text-rp-iris transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Mission Briefing Modal */}
            {selectedFeature && (
                <MissionBriefingModal
                    feature={selectedFeature}
                    onClose={() => setSelectedFeature(null)}
                />
            )}
        </div>
    )
}

function MissionBriefingModal({ feature, onClose }: { feature: Feature, onClose: () => void }) {
    const [copied, setCopied] = useState(false)

    const agentCommand = JSON.stringify({
        agent_mission: feature.fix_command?.mission || "REMRIN_STABILIZATION",
        objective: feature.objective,
        current_status: feature.status,
        instruction: feature.fix_command?.instruction || "Scan the feature and identify stabilization points.",
        context_files: feature.core_logic,
        agent_advice: feature.agent_advice
    }, null, 2)

    const copyToClipboard = () => {
        navigator.clipboard.writeText(agentCommand)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
            <div className="bg-rp-surface border-rp-highlight-med relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col">
                {/* Modal Header */}
                <div className="border-rp-highlight-low flex items-center justify-between border-b p-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-rp-iris/10 flex size-10 items-center justify-center rounded-xl">
                            <IconTerminal2 className="text-rp-iris" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-rp-text leading-tight">{feature.name}</h2>
                            <p className="text-rp-muted text-xs uppercase tracking-widest font-black">Mission Briefing</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-rp-muted hover:text-rp-text transition-colors">
                        <IconX size={24} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {/* Overview Segment */}
                    <section className="space-y-3">
                        <h5 className="text-rp-iris flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                            <IconInfoCircle size={14} />
                            Strategic Overview
                        </h5>
                        <div className="bg-rp-base/50 rounded-xl p-4 border border-rp-highlight-low">
                            <p className="text-rp-text text-sm leading-relaxed mb-4">{feature.description}</p>
                            <div className="flex flex-col gap-2">
                                <span className="text-rp-muted text-[10px] font-black uppercase">Primary Objective:</span>
                                <span className="text-rp-foam text-xs font-bold">{feature.objective}</span>
                            </div>
                        </div>
                    </section>

                    {/* Agent Advice Segment */}
                    <section className="space-y-3">
                        <h5 className="text-rp-rose flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                            <IconCode size={14} />
                            Tactical Advice (Agent to Dev)
                        </h5>
                        <div className="bg-rp-rose/5 border-rp-rose/20 rounded-xl border p-5">
                            <p className="text-rp-subtle text-xs italic leading-relaxed">
                                {feature.agent_advice}
                            </p>
                        </div>
                    </section>

                    {/* Automation Command Segment */}
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h5 className="text-rp-foam flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                                <IconTerminal2 size={14} />
                                Agent Automation Command
                            </h5>
                            <button
                                onClick={copyToClipboard}
                                className="bg-rp-surface border-rp-highlight-med hover:bg-rp-overlay flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-bold uppercase transition-all"
                            >
                                {copied ? <IconCheck size={12} className="text-rp-foam" /> : <IconCopy size={12} />}
                                {copied ? "Copied" : "Copy JSON"}
                            </button>
                        </div>
                        <div className="relative group">
                            <pre className="bg-rp-base custom-scrollbar max-h-48 overflow-auto rounded-xl border border-rp-highlight-low p-4 font-mono text-[11px] leading-normal text-rp-subtle">
                                <code>{agentCommand}</code>
                            </pre>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[9px] bg-rp-surface px-1.5 py-0.5 rounded text-rp-muted border border-rp-highlight-low font-bold">STABILIZATION_PROTOCOL.json</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Modal Footer */}
                <div className="bg-rp-base/30 border-rp-highlight-low flex items-center justify-between border-t p-6">
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter text-rp-muted">
                        <div className="flex items-center gap-1">
                            <span className="bg-rp-iris size-2 rounded-full" />
                            Status: {feature.status}
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="bg-rp-foam size-2 rounded-full" />
                            Logic: {feature.core_logic.length} files
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-rp-iris text-rp-base active:scale-95 rounded-xl px-8 py-2.5 text-sm font-black transition-all hover:opacity-90"
                    >
                        Acknowledge Briefing
                    </button>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const isStable = status.toLowerCase() === 'stable'
    const isBuggy = status.toLowerCase().includes('buggy')
    const isIncomplete = status.toLowerCase().includes('incomplete')

    return (
        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isStable ? 'bg-rp-foam/20 text-rp-foam' :
                isBuggy ? 'bg-rp-love/20 text-rp-love' :
                    'bg-rp-gold/20 text-rp-gold'
            }`}>
            {isStable ? <IconCheck size={12} /> :
                isBuggy ? <IconAlertTriangle size={12} /> :
                    <IconClock size={12} />}
            {status}
        </span>
    )
}
