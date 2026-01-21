"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { IconMoodSmile } from "@tabler/icons-react"
import { commonEmoticons } from "@/lib/chat/emoticons"

interface EmoticonPickerProps {
    onSelect: (emoji: string) => void
}

export function EmoticonPicker({ onSelect }: EmoticonPickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rp-subtle hover:text-rp-text">
                    <IconMoodSmile size={20} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 bg-rp-surface border-rp-highlight-med" align="start" side="top">
                <div className="grid grid-cols-4 gap-2">
                    {commonEmoticons.map(emoji => (
                        <button
                            key={emoji}
                            className="flex h-10 w-10 items-center justify-center rounded hover:bg-rp-highlight-low text-2xl transition-colors"
                            onClick={() => onSelect(emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}
