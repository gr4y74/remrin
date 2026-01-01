/**
 * Mood Flux HUD
 * 
 * A subtle floating indicator showing the Soul's current mood and energy state.
 * Positioned in the top-right corner of the chat area.
 */

"use client"

import React from 'react'
import { MoodState, MOOD_EMOJI, MOOD_COLORS } from '@/lib/chat-engine/mood'

interface MoodHUDProps {
    moodState: MoodState
    visible?: boolean
}

export function MoodHUD({ moodState, visible = true }: MoodHUDProps) {
    if (!visible) return null

    const { battery, mood, intensity } = moodState
    const emoji = MOOD_EMOJI[mood]
    const color = MOOD_COLORS[mood]

    // Battery bar width
    const batteryWidth = `${battery}%`

    // Glow intensity based on mood intensity
    const glowOpacity = 0.3 + (intensity * 0.4)
    const glowBlur = 8 + (intensity * 8)

    return (
        <div
            className="mood-hud"
            style={{
                '--mood-color': color,
                '--glow-opacity': glowOpacity,
                '--glow-blur': `${glowBlur}px`,
            } as React.CSSProperties}
        >
            {/* Mood Emoji with glow */}
            <div className="mood-hud__emoji">
                <span className="mood-hud__emoji-icon">{emoji}</span>
            </div>

            {/* Battery indicator */}
            <div className="mood-hud__battery">
                <div
                    className="mood-hud__battery-fill"
                    style={{
                        width: batteryWidth,
                        backgroundColor: battery < 30 ? '#eb6f92' : color
                    }}
                />
            </div>

            <style jsx>{`
                .mood-hud {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 10px;
                    background: rgba(25, 23, 36, 0.85);
                    backdrop-filter: blur(8px);
                    border-radius: 20px;
                    border: 1px solid rgba(110, 106, 134, 0.3);
                    z-index: 10;
                    transition: all 0.3s ease;
                }

                .mood-hud:hover {
                    background: rgba(30, 28, 42, 0.95);
                    border-color: var(--mood-color);
                }

                .mood-hud__emoji {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .mood-hud__emoji::before {
                    content: '';
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: var(--mood-color);
                    opacity: var(--glow-opacity);
                    filter: blur(var(--glow-blur));
                    z-index: -1;
                    animation: pulse-glow 3s ease-in-out infinite;
                }

                .mood-hud__emoji-icon {
                    font-size: 18px;
                    line-height: 1;
                    filter: drop-shadow(0 0 4px var(--mood-color));
                }

                .mood-hud__battery {
                    width: 40px;
                    height: 8px;
                    background: rgba(110, 106, 134, 0.3);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .mood-hud__battery-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease, background-color 0.3s ease;
                }

                @keyframes pulse-glow {
                    0%, 100% {
                        opacity: var(--glow-opacity);
                        transform: scale(1);
                    }
                    50% {
                        opacity: calc(var(--glow-opacity) * 0.6);
                        transform: scale(1.1);
                    }
                }

                /* Low battery warning animation */
                .mood-hud:has(.mood-hud__battery-fill[style*="width: 2"]),
                .mood-hud:has(.mood-hud__battery-fill[style*="width: 1"]) {
                    animation: low-battery-pulse 2s ease-in-out infinite;
                }

                @keyframes low-battery-pulse {
                    0%, 100% {
                        border-color: rgba(110, 106, 134, 0.3);
                    }
                    50% {
                        border-color: #eb6f92;
                    }
                }
            `}</style>
        </div>
    )
}

export default MoodHUD
