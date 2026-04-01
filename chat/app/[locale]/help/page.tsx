import Link from "next/link"
import { IconLifebuoy, IconArrowLeft, IconBrandDiscord, IconMail } from "@tabler/icons-react"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Help & Support | Remrin.ai",
    description: "Get help with Remrin.ai — guides, FAQs, and support resources.",
}

export default function HelpPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-rp-base px-4 text-center">
            {/* Icon */}
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-rp-iris/10 ring-1 ring-rp-iris/30">
                <IconLifebuoy size={40} className="text-rp-iris" />
            </div>

            {/* Heading */}
            <h1 className="font-tiempos-headline mb-3 text-4xl font-bold text-rp-text md:text-5xl">
                Help & Support
            </h1>
            <p className="mb-8 max-w-md text-rp-muted">
                Our help centre is being built. In the meantime, reach out to us directly — we respond fast.
            </p>

            {/* Action Cards */}
            <div className="mb-10 grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
                <a
                    href="mailto:support@remrin.ai"
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-rp-highlight-med bg-rp-surface p-6 transition-all hover:border-rp-iris/50 hover:bg-rp-overlay"
                >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-rp-iris/10">
                        <IconMail size={24} className="text-rp-iris" />
                    </div>
                    <div>
                        <p className="font-semibold text-rp-text group-hover:text-rp-iris">Email Support</p>
                        <p className="mt-0.5 text-sm text-rp-muted">support@remrin.ai</p>
                    </div>
                </a>

                <a
                    href="https://discord.gg/remrin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-rp-highlight-med bg-rp-surface p-6 transition-all hover:border-indigo-500/50 hover:bg-rp-overlay"
                >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10">
                        <IconBrandDiscord size={24} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-rp-text group-hover:text-indigo-400">Community Discord</p>
                        <p className="mt-0.5 text-sm text-rp-muted">Ask the community</p>
                    </div>
                </a>
            </div>

            {/* Back link */}
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-rp-muted transition-colors hover:text-rp-iris"
            >
                <IconArrowLeft size={16} />
                Back to Remrin
            </Link>
        </div>
    )
}
