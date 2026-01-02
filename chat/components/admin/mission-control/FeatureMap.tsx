"use client"

import { IconLayersIntersect, IconCheck, IconAlertTriangle, IconClock } from "@tabler/icons-react"

interface Feature {
    name: string
    status: string
    core_logic: string[]
    docs: string[]
    unfinished_tasks?: string
}

interface FeatureManifest {
    waves: {
        [key: string]: {
            features: Feature[]
        }
    }
}

export function FeatureMap({ manifest }: { manifest: FeatureManifest }) {
    return (
        <div className="space-y-8">
            {Object.entries(manifest.waves).map(([waveName, wave]) => (
                <div key={waveName} className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-rp-iris">
                        <IconLayersIntersect size={20} />
                        {waveName}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {wave.features.map((feature) => (
                            <div key={feature.name} className="bg-rp-surface border-rp-muted/20 rounded-xl border p-4 transition-all hover:bg-rp-overlay">
                                <div className="mb-2 flex items-center justify-between">
                                    <h4 className="font-bold text-rp-text">{feature.name}</h4>
                                    <StatusBadge status={feature.status} />
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex flex-wrap gap-1">
                                        {feature.core_logic.map(file => (
                                            <span key={file} className="bg-rp-base text-rp-subtle rounded-md px-2 py-0.5 font-mono">
                                                {file.split('/').pop()}
                                            </span>
                                        ))}
                                    </div>
                                    {feature.unfinished_tasks && (
                                        <p className="text-rp-love italic">
                                            <strong>Unfinished:</strong> {feature.unfinished_tasks}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
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
