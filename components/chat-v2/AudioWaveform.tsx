/**
 * AudioWaveform Component
 * Visual feedback for audio playback with animated waveform
 */

'use client';

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
    isPlaying: boolean;
    color?: string;
    bars?: number;
    height?: number;
    className?: string;
}

export function AudioWaveform({
    isPlaying,
    color = 'currentColor',
    bars = 5,
    height = 24,
    className = '',
}: AudioWaveformProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const barHeightsRef = useRef<number[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize bar heights
        if (barHeightsRef.current.length === 0) {
            barHeightsRef.current = Array(bars).fill(0.3);
        }

        const barWidth = 3;
        const barSpacing = 2;
        const totalWidth = bars * (barWidth + barSpacing) - barSpacing;

        canvas.width = totalWidth;
        canvas.height = height;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            barHeightsRef.current.forEach((barHeight, i) => {
                const x = i * (barWidth + barSpacing);
                const currentHeight = isPlaying
                    ? height * barHeight
                    : height * 0.3;

                // Draw bar
                ctx.fillStyle = color;
                ctx.fillRect(
                    x,
                    (height - currentHeight) / 2,
                    barWidth,
                    currentHeight
                );

                // Update height for next frame
                if (isPlaying) {
                    // Random oscillation
                    barHeightsRef.current[i] =
                        0.3 + Math.random() * 0.7 * Math.sin(Date.now() / 200 + i);
                } else {
                    // Decay to idle state
                    barHeightsRef.current[i] = barHeightsRef.current[i] * 0.9 + 0.3 * 0.1;
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, color, bars, height]);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ display: 'block' }}
        />
    );
}

/**
 * Simple text-based waveform alternative
 */
export function SimpleWaveform({
    isPlaying,
    className = '',
}: {
    isPlaying: boolean;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className={`w-1 bg-current rounded-full transition-all duration-200 ${isPlaying ? 'animate-pulse' : ''
                        }`}
                    style={{
                        height: isPlaying
                            ? `${12 + Math.random() * 12}px`
                            : '8px',
                        animationDelay: `${i * 100}ms`,
                    }}
                />
            ))}
        </div>
    );
}
