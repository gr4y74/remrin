"use client"

import * as React from "react"
import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AudioStudioLayoutProps {
    children: React.ReactNode
    isDirty?: boolean
    onSave?: () => void
    onDiscard?: () => void
}

export function AudioStudioLayout({
    children,
    isDirty = false,
    onSave,
    onDiscard,
}: AudioStudioLayoutProps) {
    const router = useRouter()
    const [showExitPrompt, setShowExitPrompt] = React.useState(false)
    const [nextPath, setNextPath] = React.useState<string | null>(null)

    const handleNavigation = (path: string) => {
        if (isDirty) {
            setNextPath(path)
            setShowExitPrompt(true)
        } else {
            router.push(path)
        }
    }

    return (
        <div className="flex h-screen w-full flex-col bg-background text-foreground animate-in fade-in duration-300">
            {/* Header */}
            <header className="flex h-16 items-center border-b px-4 md:px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleNavigation("/studio")}
                        className="rounded-full hover:bg-muted"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back to Studio</span>
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-semibold leading-none tracking-tight">
                            Audio Studio
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Configure voice & audio settings
                        </p>
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {isDirty && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
                            <span className="text-xs text-muted-foreground mr-2 hidden md:inline-block">
                                Unsaved changes
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDiscard}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Discard
                            </Button>
                            <Button size="sm" onClick={onSave} className="gap-2">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content - No scroll here, handled by children if needed or grid layout */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>

            {/* Exit Prompt */}
            <AlertDialog open={showExitPrompt} onOpenChange={setShowExitPrompt}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowExitPrompt(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (nextPath) router.push(nextPath)
                            }}
                        >
                            Discard & Leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
