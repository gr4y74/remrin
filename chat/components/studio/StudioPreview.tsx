"use client"

import { cn } from "@/lib/utils"
import { IconPhoto, IconDownload, IconShare, IconRefresh, IconExternalLink, IconLoader2, IconCircleX, IconHistory } from "@tabler/icons-react"
import Image from "next/image"

interface StudioPreviewProps {
    status: 'idle' | 'generating' | 'completed' | 'failed'
    outputUrl?: string
    previewUrl?: string
    previewName?: string
    error?: string
    onReset: () => void
    onRegenerate: () => void
}

export function StudioPreview({ status, outputUrl, previewUrl, previewName, error, onReset, onRegenerate }: StudioPreviewProps) {
    const isVideo = previewUrl?.toLowerCase().endsWith('.mp4');

    return (
        <div className="flex flex-col h-full bg-rp-base relative overflow-hidden">
            {/* Background Grain/Noise Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/images/noise.png')] bg-repeat" />

            <div className="flex-1 flex items-center justify-center p-8 md:p-12 relative z-10">
                {/* Idle/Preview State */}
                {status === 'idle' && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-500">
                        {previewUrl ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                                <div className="relative group max-w-[90%] max-h-[80%] rounded-2xl overflow-hidden shadow-2xl border border-rp-highlight-low ring-1 ring-rp-highlight-low/20 aspect-square md:aspect-auto">
                                    {isVideo ? (
                                        <video
                                            src={previewUrl}
                                            className="max-w-full max-h-full object-contain bg-rp-surface"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={previewUrl}
                                            alt={previewName || "Style preview"}
                                            className="max-w-full max-h-full object-contain bg-rp-surface"
                                        />
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                        <p className="text-white text-sm font-bold uppercase tracking-widest text-center shadow-sm">
                                            Style: {previewName}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center space-y-1">
                                    <h2 className="text-xl font-bold text-rp-text">Ready to Create</h2>
                                    <p className="text-rp-muted text-sm">Your masterpiece is just a prompt away.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-6 text-center max-w-md">
                                <div className="size-32 rounded-full bg-rp-overlay/30 flex items-center justify-center border border-rp-highlight-low shadow-inner">
                                    <IconPhoto size={64} className="text-rp-muted/50" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-rp-text">Ready to Create</h2>
                                    <p className="text-rp-muted">Configure your settings in the left panel and describe what you want to see. Your masterpiece is just a prompt away.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Generating State */}
                {status === 'generating' && (
                    <div className="flex flex-col items-center gap-8 text-center animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="size-48 rounded-2xl bg-rp-surface border border-rp-highlight-low flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-rp-iris/20 to-rp-foam/20 animate-pulse" />
                                <IconLoader2 size={48} className="text-rp-iris animate-spin" />
                            </div>
                            {/* Scanning Line Effect */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rp-iris to-transparent animate-scan z-20 shadow-[0_0_15px_rgba(196,167,231,0.8)]" />
                        </div>
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold text-rp-text animate-pulse">Brewing your Soul...</h2>
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-sm text-rp-muted">Estimated time: ~15 seconds</span>
                                <div className="w-48 h-1.5 bg-rp-surface rounded-full overflow-hidden border border-rp-highlight-low">
                                    <div className="h-full bg-rp-iris animate-progress" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Completed State */}
                {status === 'completed' && outputUrl && (
                    <div className="w-full h-full flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
                        <div className="relative group max-w-[90%] max-h-[80%] rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 ring-inset">
                            <img
                                src={outputUrl}
                                alt="Generated result"
                                className="max-w-full max-h-full object-contain bg-rp-surface"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/20 transition-all active:scale-95" title="Download">
                                    <IconDownload size={24} />
                                </button>
                                <button className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/20 transition-all active:scale-95" title="Share">
                                    <IconShare size={24} />
                                </button>
                                <button
                                    onClick={onRegenerate}
                                    className="p-3 bg-rp-iris/80 hover:bg-rp-iris rounded-full text-white backdrop-blur-md border border-rp-iris/20 transition-all active:scale-95"
                                    title="Regenerate"
                                >
                                    <IconRefresh size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={onReset}
                                className="px-6 py-2.5 bg-rp-surface hover:bg-rp-highlight-low/30 text-rp-text rounded-lg border border-rp-highlight-low transition-all text-sm font-medium"
                            >
                                Start New
                            </button>
                            <a
                                href={outputUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-2.5 bg-rp-overlay hover:bg-rp-overlay/80 text-rp-foam rounded-lg border border-rp-foam/30 transition-all text-sm font-medium flex items-center gap-2"
                            >
                                <IconExternalLink size={18} />
                                High Res
                            </a>
                        </div>
                    </div>
                )}

                {/* Failed State */}
                {status === 'failed' && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500 text-center max-w-md">
                        <div className="size-24 rounded-full bg-rp-love/10 flex items-center justify-center border border-rp-love/30 text-rp-love">
                            <IconCircleX size={48} />
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-rp-text">Generation Failed</h2>
                                <p className="text-rp-muted">{error || "Something went wrong while communicating with the AI. Your Aether has been refunded."}</p>
                            </div>
                            <button
                                onClick={onReset}
                                className="px-8 py-3 bg-rp-love/20 hover:bg-rp-love/30 text-rp-love rounded-xl border border-rp-love/30 transition-all font-bold"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* History Peek (Bottom Overlay) */}
            <div className="h-24 bg-gradient-to-t from-rp-base to-transparent flex items-end px-8 pb-4">
                <div className="flex items-center gap-2 text-rp-muted text-xs font-medium cursor-pointer hover:text-rp-text transition-colors">
                    <IconHistory size={16} />
                    <span>Recent Creations (0)</span>
                </div>
            </div>
        </div>
    )
}
