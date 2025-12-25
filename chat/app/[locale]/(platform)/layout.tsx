"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ReactNode } from "react"

interface PlatformLayoutProps {
    children: ReactNode
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
    return (
        <Dashboard>
            {children}
        </Dashboard>
    )
}
