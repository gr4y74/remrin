/**
 * SoulRevealCard
 *
 * Dramatic reveal card for a completed soul.
 * Displayed when show_soul_reveal tool is called.
 */

'use client'

import { FC } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { IconSparkles, IconVolume, IconMessageCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { SoulRevealData } from '@/lib/forge/tool-handlers'

interface SoulRevealCardProps {
    data: SoulRevealData
    onStartChat?: (personaId?: string) => void
    onPreviewVoice?: () => void
    personaId?: string
}

export const SoulRevealCard: FC<SoulRevealCardProps> = ({
    data,
    onStartChat,
    onPreviewVoice,
    personaId
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative mx-auto max-w-md overflow-hidden rounded-3xl"
        >
            {/* Glowing background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-rp-iris/20 via-rp-rose/10 to-rp-pine/20 blur-xl" />

            {/* Card content */}
            <div className="relative rounded-3xl border border-rp-muted bg-rp-base/60 p-6 backdrop-blur-xl">
                {/* Sparkle accent */}
                <div className="absolute -right-4 -top-4 text-rp-gold/60">
                    <IconSparkles size={40} className="animate-pulse" />
                </div>

                {/* Portrait */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative mx-auto mb-6 size-48 overflow-hidden rounded-full ring-4 ring-rp-iris/30"
                >
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-rp-iris/30 to-rp-rose/30" />
                    <Image
                        src={data.imageUrl}
                        alt={data.name}
                        fill
                        className="object-cover"
                    />
                    {/* Glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-rp-iris/50 to-transparent" />
                </motion.div>

                {/* Name */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-2 text-center font-serif text-3xl font-bold text-rp-text"
                >
                    {data.name}
                </motion.h2>

                {/* Essence */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mb-4 text-center text-sm italic text-rp-iris/80"
                >
                    {data.essence}
                </motion.p>

                {/* Personality traits */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mb-4 flex flex-wrap justify-center gap-2"
                >
                    {data.personality.split(',').map((trait, i) => (
                        <span
                            key={i}
                            className="rounded-full bg-rp-iris/20 px-3 py-1 text-xs text-rp-iris"
                        >
                            {trait.trim()}
                        </span>
                    ))}
                </motion.div>

                {/* Voice description */}
                {data.voiceDescription && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mb-6 text-center text-sm text-rp-muted"
                    >
                        <IconVolume className="mr-1 inline size-4" />
                        {data.voiceDescription}
                    </motion.div>
                )}

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex justify-center gap-3"
                >
                    {onPreviewVoice && data.voiceId && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPreviewVoice}
                            className="border-rp-iris/30 bg-rp-iris/10 text-rp-iris hover:bg-rp-iris/20"
                        >
                            <IconVolume className="mr-2 size-4" />
                            Preview Voice
                        </Button>
                    )}
                    {onStartChat && (
                        <Button
                            size="sm"
                            onClick={() => onStartChat(personaId)}
                            className="bg-gradient-to-r from-rp-iris to-rp-rose text-rp-base hover:from-rp-iris/80 hover:to-rp-rose/80"
                        >
                            <IconMessageCircle className="mr-2 size-4" />
                            Start Chat
                        </Button>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
}
