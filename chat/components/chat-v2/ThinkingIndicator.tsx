/**
 * Thinking Indicator Component
 * 
 * Animated dots to show AI is processing/generating
 */

"use client"

import React from 'react'

export function ThinkingIndicator() {
    return (
        <div className="flex items-center gap-1.5 p-3 w-fit animate-in fade-in zoom-in-95 duration-300">
            <div className="h-2 w-2 animate-pulse-dot rounded-full bg-rp-iris [animation-delay:0s]"></div>
            <div className="h-2 w-2 animate-pulse-dot rounded-full bg-rp-iris [animation-delay:0.2s]"></div>
            <div className="h-2 w-2 animate-pulse-dot rounded-full bg-rp-iris [animation-delay:0.4s]"></div>
        </div>
    )
}
