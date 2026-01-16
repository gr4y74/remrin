"use client"

import { FC, ReactNode } from "react"
import { IconInfoCircle } from "@tabler/icons-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "./tooltip"

interface InfoTooltipProps {
    /** The tooltip content (can be rich JSX) */
    content: ReactNode
    /** Optional: size of the info icon */
    size?: number
    /** Optional: positioning of tooltip */
    side?: "left" | "right" | "top" | "bottom"
    /** Optional: custom trigger element instead of default info icon */
    trigger?: ReactNode
    /** Optional: delay before showing tooltip (ms) */
    delayDuration?: number
    /** Optional: custom icon color class */
    iconClassName?: string
}

/**
 * InfoTooltip - A hoverable info icon that displays helpful explanations
 * 
 * Usage:
 * <InfoTooltip content="This is helpful text" />
 * 
 * Or with rich content:
 * <InfoTooltip content={<div><strong>Title</strong><p>Description</p></div>} />
 */
export const InfoTooltip: FC<InfoTooltipProps> = ({
    content,
    size = 14,
    side = "top",
    trigger,
    delayDuration = 200,
    iconClassName = "text-rp-muted hover:text-rp-subtle transition-colors cursor-help"
}) => {
    return (
        <TooltipProvider delayDuration={delayDuration}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {trigger || (
                        <span className={iconClassName}>
                            <IconInfoCircle size={size} />
                        </span>
                    )}
                </TooltipTrigger>
                <TooltipContent
                    side={side}
                    className="max-w-xs rounded-lg border border-rp-highlight-med bg-rp-surface p-3 text-sm shadow-lg"
                >
                    {content}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

/**
 * Preset tooltip content components for consistent styling
 */
export const TooltipTitle: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="mb-1 font-semibold text-rp-text">{children}</div>
)

export const TooltipBody: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="text-rp-subtle">{children}</div>
)

export const TooltipExample: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="mt-2 rounded bg-rp-overlay/50 px-2 py-1 font-mono text-xs text-rp-iris">
        💡 {children}
    </div>
)
