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
            <div className="from-rp-iris/20 via-rp-rose/10 to-rp-pine/20 absolute inset-0 bg-gradient-to-br blur-xl" />

            {/* Card content */}
            <div className="border-rp-muted bg-rp-base/60 relative rounded-3xl border p-6 backdrop-blur-xl">
                {/* Sparkle accent */}
                <div className="text-rp-gold/60 absolute -right-4 -top-4">
                    <IconSparkles size={40} className="animate-pulse" />
                </div>

                {/* Portrait */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="ring-rp-iris/30 relative mx-auto mb-6 size-48 overflow-hidden rounded-full ring-4"
                >
                    <div className="from-rp-iris/30 to-rp-rose/30 absolute inset-0 animate-pulse bg-gradient-to-tr" />
                    <Image
                        src={data.imageUrl}
                        alt={data.name}
                        fill
                        className="object-cover"
                    />
                    {/* Glow overlay */}
                    <div className="from-rp-iris/50 absolute inset-0 bg-gradient-to-t to-transparent" />
                </motion.div>

                {/* Name */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-rp-text mb-2 text-center font-serif text-3xl font-bold"
                >
                    {data.name}
                </motion.h2>

                {/* Essence */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-rp-iris/80 mb-4 text-center text-sm italic"
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
                            className="bg-rp-iris/20 text-rp-iris rounded-full px-3 py-1 text-xs"
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
                        className="text-rp-muted mb-6 text-center text-sm"
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
                            className="from-rp-iris to-rp-rose text-rp-base hover:from-rp-iris/80 hover:to-rp-rose/80 bg-gradient-to-r"
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
