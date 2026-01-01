import Link from "next/link"
import { IconGhost } from "@tabler/icons-react"

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 text-center text-white">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rp-iris/10 text-rp-iris animate-pulse">
                <IconGhost size={48} />
            </div>
            <h1 className="mb-2 font-tiempos-headline text-4xl font-bold md:text-5xl">404</h1>
            <h2 className="mb-6 text-xl text-rp-subtle">Lost in the Void</h2>
            <p className="mb-8 max-w-md text-white/50">
                The soul you seek has not been summoned, or perhaps it has returned to the Aether.
            </p>
            <Link
                href="/"
                className="rounded-full border border-white/10 bg-white/5 px-8 py-3 font-medium text-white transition-all hover:bg-white/10 hover:scale-105"
            >
                Return to Sanctuary
            </Link>
        </div>
    )
}
