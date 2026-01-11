'use client';

import { ReactionType } from '@/types/social';
import { motion } from 'framer-motion';
import { Heart, Stars, Zap, Lightbulb } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ReactionPickerProps {
    onSelect: (type: ReactionType) => void;
    children: React.ReactNode;
}

const reactions: { type: ReactionType; icon: any; color: string; label: string }[] = [
    { type: 'like', icon: Heart, color: 'text-rp-love', label: 'Like' },
    { type: 'love', icon: Stars, color: 'text-rp-rose', label: 'Love' },
    { type: 'celebrate', icon: Zap, color: 'text-rp-gold', label: 'Celebrate' },
    { type: 'insightful', icon: Lightbulb, color: 'text-rp-foam', label: 'Insightful' },
];

export function ReactionPicker({ onSelect, children }: ReactionPickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 bg-rp-surface border-rp-highlight-low rounded-full flex gap-1 animate-fadeIn">
                {reactions.map((reaction) => (
                    <motion.button
                        key={reaction.type}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onSelect(reaction.type)}
                        className={`p-2 rounded-full hover:bg-rp-highlight-low transition-colors ${reaction.color}`}
                        title={reaction.label}
                    >
                        <reaction.icon className="w-6 h-6 fill-current" />
                    </motion.button>
                ))}
            </PopoverContent>
        </Popover>
    );
}
