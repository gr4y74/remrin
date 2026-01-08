"use client";

import { useState, useEffect } from "react";
import { Play, Square, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface VoicePreviewProps {
    voiceId: string;
    previewUrl?: string; // Optional, can be passed if we have it
    onPlay?: () => void;
    onStop?: () => void;
    isPlaying?: boolean;
    isLoading?: boolean;
    className?: string;
}

export function VoicePreview({
    voiceId,
    previewUrl,
    onPlay,
    onStop,
    isPlaying = false,
    isLoading = false,
    className
}: VoicePreviewProps) {
    const togglePlayback = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            onStop?.();
        } else {
            onPlay?.();
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "relative size-8 rounded-full bg-rp-surface transition-all hover:bg-rp-highlight-low",
                    isPlaying && "bg-rp-iris/10 text-rp-iris hover:bg-rp-iris/20"
                )}
                onClick={togglePlayback}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="size-4 animate-spin text-rp-subtle" />
                ) : isPlaying ? (
                    <Square className="size-3 fill-current" />
                ) : (
                    <Play className="ml-0.5 size-3.5 fill-current" />
                )}

                {/* Ring animation when playing */}
                {isPlaying && (
                    <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-rp-iris/20 opacity-75" />
                )}
            </Button>

            {/* Mini Waveform Visualization */}
            <div className="flex h-8 items-center gap-[2px] px-1">
                {isPlaying ? (
                    <PlayingWaveform />
                ) : (
                    <StaticWaveform />
                )}
            </div>
        </div>
    );
}

function PlayingWaveform() {
    return (
        <>
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-rp-iris"
                    animate={{
                        height: [4, 16, 8, 20, 4],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </>
    );
}

function StaticWaveform() {
    return (
        <>
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full bg-rp-subtle/30"
                    style={{
                        height: 4 + Math.random() * 12
                    }}
                />
            ))}
        </>
    );
}
