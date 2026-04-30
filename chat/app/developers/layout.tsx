import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/components/utility/providers"
import { ReactNode } from "react"
import "../[locale]/globals.css"

export const metadata = {
    title: "Remrin API - Developer Portal",
    description: "Build deep, persistent AI relationships with the Remrin B2B API."
}

export default function DevelopersLayout({
    children
}: {
    children: ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link href="//cdn.jsdelivr.net/gh/Lukas-W/font-logos@v0.18/assets/font-logos.css" rel="stylesheet" />
            </head>
            <body suppressHydrationWarning className="bg-[#191724] text-[#e0def4] antialiased">
                <Providers attribute="class" defaultTheme="dark">
                    <Toaster richColors position="top-center" duration={3000} />
                    <main className="min-h-screen w-full">
                        {children}
                    </main>
                </Providers>
            </body>
        </html>
    )
}
