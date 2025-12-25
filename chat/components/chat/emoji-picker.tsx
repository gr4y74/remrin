"use client"

import { FC, useState, useRef, useEffect } from "react"
import { IconMoodSmile } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void
}

export const EmojiPicker: FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
    const [isOpen, setIsOpen] = useState(false)
    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    const handleSelect = (emoji: any) => {
        onEmojiSelect(emoji.native)
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={pickerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "rounded p-1.5 transition-colors hover:bg-rp-overlay",
                    isOpen ? "bg-rp-overlay text-rp-rose" : "text-rp-muted"
                )}
                title="Insert emoji"
            >
                <IconMoodSmile size={22} />
            </button>

            {isOpen && (
                <div className="absolute bottom-12 left-0 z-50">
                    <Picker
                        data={data}
                        onEmojiSelect={handleSelect}
                        theme="dark"
                        previewPosition="none"
                        skinTonePosition="none"
                        set="native"
                        perLine={8}
                        emojiSize={24}
                        emojiButtonSize={32}
                    />
                </div>
            )}
        </div>
    )
}
