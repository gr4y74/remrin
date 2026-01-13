'use client';

import { useState, useEffect } from 'react';
import UniversalPicker, { PickerItem } from './UniversalPicker';

interface EmojiButtonProps {
    onSelect: (item: PickerItem) => void;
    position?: 'top' | 'bottom' | 'left' | 'right';
    theme?: 'dark' | 'light';
    className?: string;
}

export function EmojiButton({
    onSelect,
    position = 'bottom',
    theme = 'dark',
    className = ''
}: EmojiButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="
          p-2 rounded-lg hover:bg-rp-base
          text-rp-muted hover:text-rp-text
          transition-colors
        "
                title="Add emoji, GIF, or sticker"
                type="button"
                aria-label="Add emoji, GIF, or sticker"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
            </button>

            {isOpen && (
                <UniversalPicker
                    onSelect={(item) => {
                        onSelect(item);
                        setIsOpen(false);
                    }}
                    onClose={() => setIsOpen(false)}
                    position={position}
                    theme={theme}
                />
            )}
        </div>
    );
}
