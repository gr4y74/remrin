"use client"

import * as React from "react"
import { Drawer as VaulDrawer } from "vaul"
import { useMediaQuery } from "react-responsive"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface MobileDrawerProps {
    children: React.ReactNode
    trigger?: React.ReactNode
    title?: string
    description?: string
    className?: string
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function MobileDrawer({
    children,
    trigger,
    title,
    description,
    className,
    open,
    onOpenChange,
}: MobileDrawerProps) {
    const isDesktop = useMediaQuery({ query: "(min-width: 768px)" })

    if (isDesktop) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
                <DialogContent className={cn("sm:max-w-[425px] bg-rp-surface border-rp-muted/20", className)}>
                    {(title || description) && (
                        <DialogHeader>
                            {title && <DialogTitle className="text-rp-text">{title}</DialogTitle>}
                            {description && (
                                <DialogDescription className="text-rp-subtle">
                                    {description}
                                </DialogDescription>
                            )}
                        </DialogHeader>
                    )}
                    {children}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <VaulDrawer.Root open={open} onOpenChange={onOpenChange} shouldScaleBackground>
            {trigger && <VaulDrawer.Trigger asChild>{trigger}</VaulDrawer.Trigger>}
            <VaulDrawer.Portal>
                <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                <VaulDrawer.Content
                    className={cn(
                        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[20px] border-t border-rp-muted/20 bg-rp-surface",
                        className
                    )}
                >
                    <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-rp-muted/20" />
                    <div className="flex flex-col p-6 pt-2">
                        {(title || description) && (
                            <div className="mb-4 space-y-1.5 text-center">
                                {title && <h2 className="text-lg font-semibold text-rp-text">{title}</h2>}
                                {description && (
                                    <p className="text-sm text-rp-subtle">{description}</p>
                                )}
                            </div>
                        )}
                        {children}
                    </div>
                </VaulDrawer.Content>
            </VaulDrawer.Portal>
        </VaulDrawer.Root>
    )
}
