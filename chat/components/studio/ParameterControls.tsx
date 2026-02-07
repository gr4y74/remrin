"use client"

import { cn } from "@/lib/utils"
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { useState } from "react"

interface ParameterControlsProps {
    onParamChange: (key: string, value: any) => void
    parameters: any
}

export function ParameterControls({ onParamChange, parameters }: ParameterControlsProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    const aspectRatios = [
        { id: "1:1", label: "Square", icon: "aspect-square" },
        { id: "16:9", label: "Wide", icon: "aspect-video" },
        { id: "9:16", label: "Vertical", icon: "aspect-[9/16]" },
        { id: "4:3", label: "Classic", icon: "aspect-[4/3]" },
        { id: "3:4", label: "Portrait", icon: "aspect-[3/4]" },
    ]

    return (
        <div className="space-y-6">
            {/* Preference */}
            <div className="space-y-3">
                <h3 className="text-sm font-medium text-rp-muted uppercase tracking-wider">Preference</h3>
                <div className="flex p-1 bg-rp-surface rounded-lg border border-rp-highlight-low">
                    {["Speed", "Quality"].map((option) => (
                        <button
                            key={option}
                            onClick={() => onParamChange('preference', option.toLowerCase())}
                            className={cn(
                                "flex-1 py-1.5 px-4 rounded-md text-xs font-bold transition-all",
                                (parameters.preference || 'quality') === option.toLowerCase()
                                    ? "bg-rp-iris text-white shadow-sm"
                                    : "text-rp-subtle hover:text-rp-text hover:bg-white/5"
                            )}
                        >
                            <span className="uppercase tracking-widest">{option}</span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-6 mt-3 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative size-5 rounded border-2 border-rp-highlight-low bg-rp-surface group-hover:border-rp-iris transition-all">
                            <input
                                type="checkbox"
                                className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                                checked={parameters.ye_newe}
                                onChange={(e) => onParamChange('ye_newe', e.target.checked)}
                            />
                            <div className="absolute inset-0.5 bg-rp-iris rounded-sm scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                        <span className="text-xs font-bold text-rp-subtle uppercase tracking-widest group-hover:text-rp-text">Ye Newe</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative size-5 rounded border-2 border-rp-highlight-low bg-rp-surface group-hover:border-rp-iris transition-all">
                            <input
                                type="checkbox"
                                className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                                checked={parameters.ye_olde}
                                onChange={(e) => onParamChange('ye_olde', e.target.checked)}
                            />
                            <div className="absolute inset-0.5 bg-rp-iris rounded-sm scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                        <span className="text-xs font-bold text-rp-subtle uppercase tracking-widest group-hover:text-rp-text">Ye Olde</span>
                    </label>
                </div>
            </div>

            {/* Shape Selector Dropdown */}
            <div className="space-y-3">
                <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full flex items-center justify-between py-2 text-sm font-bold text-rp-muted uppercase tracking-widest border-b border-rp-highlight-low hover:text-rp-text transition-colors"
                >
                    <span>Choose Shape</span>
                    {isAdvancedOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </button>

                {isAdvancedOpen && (
                    <div className="grid grid-cols-2 gap-2 pt-2 animate-in slide-in-from-top-2 duration-300">
                        {aspectRatios.map((ratio) => (
                            <button
                                key={ratio.id}
                                onClick={() => onParamChange('aspect_ratio', ratio.id)}
                                className={cn(
                                    "px-3 py-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                    parameters.aspect_ratio === ratio.id
                                        ? "border-rp-iris bg-rp-iris/5 text-rp-text"
                                        : "border-rp-highlight-low bg-rp-surface text-rp-subtle hover:border-rp-muted"
                                )}
                            >
                                <div className={cn("w-8 border-2 border-current rounded-sm", ratio.icon, "h-5 opacity-60")} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{ratio.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
