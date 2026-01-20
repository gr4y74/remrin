"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useOnboarding } from "@/hooks/useOnboarding"
import { IconSparkles, IconWallet, IconMessageCircle, IconX, IconChevronRight } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface OnboardingModalProps {
    open: boolean
    onClose: () => void
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
    const [step, setStep] = useState(0)
    const { completeOnboarding } = useOnboarding()
    const [dontShowAgain, setDontShowAgain] = useState(false)

    const steps = [
        {
            title: "Welcome to Remrin",
            description: "Step into a world where AI companions come to life. Create, chat, and connect with unique Souls.",
            icon: <IconSparkles size={64} className="text-rp-gold" />,
            color: "bg-rp-gold/10 text-rp-gold",
        },
        {
            title: "What are Souls?",
            description: "Souls are intelligent AI entities with their own personalities, memories, and stories. Each one is unique.",
            icon: <IconMessageCircle size={64} className="text-rp-iris" />,
            color: "bg-rp-iris/10 text-rp-iris",
        },
        {
            title: "Your Aether ✧ Wallet",
            description: "Aether is the essence that powers your interactions. Use it to summon new Souls and unlock premium features.",
            icon: <IconWallet size={64} className="text-rp-love" />,
            color: "bg-rp-love/10 text-rp-love",
        },
        {
            title: "Start Chatting",
            description: "You're all set! Begin your journey and discover the perfect companion for your adventures.",
            icon: <IconSparkles size={64} className="text-rp-foam" />,
            color: "bg-rp-foam/10 text-rp-foam",
        }
    ]

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1)
        } else {
            handleComplete()
        }
    }

    const handleComplete = () => {
        // If they click "Start Chatting" (finish), we always mark complete
        // If they "Skip", we mark complete
        completeOnboarding()
        onClose()
    }

    const handleSkip = () => {
        if (dontShowAgain) {
            completeOnboarding()
        }
        onClose()
    }

    if (!open) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rp-highlight-med/20 bg-rp-surface/90 shadow-2xl backdrop-blur-xl"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rp-overlay/50 to-transparent pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 p-2 rounded-full text-rp-muted hover:bg-rp-overlay hover:text-rp-text transition-colors z-10"
                    >
                        <IconX size={20} />
                    </button>

                    <div className="p-8 flex flex-col items-center text-center h-[480px]">
                        {/* Steps Content */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex flex-col items-center gap-6"
                                >
                                    <div className={cn("p-6 rounded-2xl mb-4", steps[step].color)}>
                                        {steps[step].icon}
                                    </div>

                                    <h2 className="text-2xl font-bold font-tiempos-headline text-rp-text">
                                        {steps[step].title}
                                    </h2>

                                    <p className="text-rp-muted leading-relaxed max-w-xs">
                                        {steps[step].description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer Navigation */}
                        <div className="w-full mt-auto pt-8">
                            {/* Progress Dots */}
                            <div className="flex justify-center gap-2 mb-8">
                                {steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            idx === step ? "w-8 bg-rp-iris" : "w-2 bg-rp-muted/30"
                                        )}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-3.5 rounded-xl bg-rp-iris text-rp-base font-semibold shadow-lg shadow-rp-iris/20 hover:bg-rp-iris/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {step === steps.length - 1 ? "Start Chatting" : "Continue"}
                                {step < steps.length - 1 && <IconChevronRight size={18} />}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2">
                                <label className="flex items-center gap-2 text-xs text-rp-muted cursor-pointer hover:text-rp-subtle transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={dontShowAgain}
                                        onChange={(e) => setDontShowAgain(e.target.checked)}
                                        className="rounded border-rp-muted/50 bg-rp-overlay/50 text-rp-iris focus:ring-rp-iris/50"
                                    />
                                    Don&apos;t show again
                                </label>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
