import { RefObject } from 'react';

/**
 * Helper hook for inserting emojis into text inputs at cursor position
 */
export function useEmojiInsertion(
    inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
    value: string,
    setValue: (value: string) => void
) {
    const insertEmoji = (emoji: string) => {
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newText = value.slice(0, start) + emoji + value.slice(end);

        setValue(newText);

        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
            input.focus();
            input.setSelectionRange(start + emoji.length, start + emoji.length);
        });
    };

    return { insertEmoji };
}
