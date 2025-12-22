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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20 blur-xl" />

            {/* Card content */}
            <div className="relative rounded-3xl border border-white/20 bg-black/60 p-6 backdrop-blur-xl">
                {/* Sparkle accent */}
                <div className="absolute -right-4 -top-4 text-yellow-300/60">
                    <IconSparkles size={40} className="animate-pulse" />
                </div>

                {/* Portrait */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="relative mx-auto mb-6 size-48 overflow-hidden rounded-full ring-4 ring-purple-400/30"
                >
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-purple-500/30 to-pink-500/30" />
                    <Image
                        src={data.imageUrl}
                        alt={data.name}
                        fill
                        className="object-cover"
                    />
                    {/* Glow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent" />
                </motion.div>

                {/* Name */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-2 text-center font-serif text-3xl font-bold text-white"
                >
                    {data.name}
                </motion.h2>

                {/* Essence */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mb-4 text-center text-sm italic text-purple-200/80"
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
                            className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-200"
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
                        className="mb-6 text-center text-sm text-gray-400"
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
                            className="border-purple-400/30 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20"
                        >
                            <IconVolume className="mr-2 size-4" />
                            Preview Voice
                        </Button>
                    )}
                    {onStartChat && (
                        <Button
                            size="sm"
                            onClick={() => onStartChat(personaId)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
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
