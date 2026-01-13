'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2, Edit2 } from 'lucide-react';
import { EmojiButton } from '@/components/ui/EmojiButton';
import { PickerItem } from '@/components/ui/UniversalPicker';
import { useEmojiInsertion } from '@/hooks/useEmojiInsertion';

interface EditableTextareaProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    placeholder?: string;
    maxLength?: number;
    validate?: (value: string) => string | null;
    label?: string;
    disabled?: boolean;
    className?: string;
    minRows?: number;
    maxRows?: number;
}

export function EditableTextarea({
    value,
    onSave,
    placeholder = 'Click to edit',
    maxLength = 500,
    validate,
    label,
    disabled = false,
    className = '',
    minRows = 3,
    maxRows = 10,
}: EditableTextareaProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { insertEmoji } = useEmojiInsertion(textareaRef, currentValue, setCurrentValue);

    // Update current value when prop changes
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [isEditing]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && isEditing) {
            const textarea = textareaRef.current;
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
            const minHeight = lineHeight * minRows;
            const maxHeight = lineHeight * maxRows;
            textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`;
        }
    }, [currentValue, isEditing, minRows, maxRows]);

    const handleSave = async () => {
        // Don't save if no changes
        if (currentValue === value) {
            setIsEditing(false);
            return;
        }

        // Validate
        if (validate) {
            const validationError = validate(currentValue);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        setIsSaving(true);
        setError(null);

        try {
            await onSave(currentValue);
            setIsEditing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
            setCurrentValue(value); // Rollback
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setCurrentValue(value);
        setIsEditing(false);
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSave();
        }
    };

    const handleEmojiSelect = (item: PickerItem) => {
        if (item.type === 'emoji') {
            insertEmoji(item.data);
        }
    };

    const handleClick = () => {
        if (!disabled && !isEditing) {
            setIsEditing(true);
        }
    };

    const remainingChars = maxLength - currentValue.length;
    const isNearLimit = remainingChars < 50;

    if (!isEditing) {
        return (
            <div className={`group ${className}`}>
                {label && (
                    <label className="block text-sm font-medium text-rp-subtle mb-1">
                        {label}
                    </label>
                )}
                <div
                    onClick={handleClick}
                    className={`
                        relative cursor-pointer hover:bg-rp-overlay rounded-lg px-3 py-2 
                        transition-all duration-200 border border-transparent min-h-[80px]
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-rp-iris/30'}
                    `}
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick();
                        }
                    }}
                    aria-label={`Edit ${label || 'field'}`}
                >
                    <div className={`whitespace-pre-wrap ${value ? 'text-rp-text' : 'text-rp-subtle'}`}>
                        {value || placeholder}
                    </div>
                    {!disabled && (
                        <Edit2 className="absolute right-2 top-2 w-4 h-4 text-rp-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-rp-subtle mb-1">
                    {label}
                </label>
            )}
            <div className="flex items-start gap-2">
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={currentValue}
                        onChange={(e) => {
                            setCurrentValue(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        maxLength={maxLength}
                        disabled={isSaving}
                        placeholder={placeholder}
                        className="w-full bg-rp-base border border-rp-iris rounded-lg px-3 py-2 text-rp-text 
                                 focus:outline-none focus:ring-2 focus:ring-rp-iris/50 focus:border-rp-iris
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
                        style={{ minHeight: `${minRows * 1.5}rem` }}
                        aria-label={label}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'textarea-error' : 'char-count'}
                    />
                    <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-rp-subtle">
                            Press Ctrl+Enter to save, Esc to cancel
                        </div>
                        <div
                            id="char-count"
                            className={`text-xs ${isNearLimit ? 'text-rp-love font-medium' : 'text-rp-subtle'
                                }`}
                        >
                            {currentValue.length} / {maxLength}
                        </div>
                    </div>
                    {error && (
                        <div id="textarea-error" className="text-xs text-rp-love mt-1" role="alert">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-1 pt-2">
                    {!isSaving && (
                        <EmojiButton
                            onSelect={handleEmojiSelect}
                            position="left"
                            theme="dark"
                            className="p-1 rounded hover:bg-rp-highlight-low text-rp-muted hover:text-rp-text transition-colors content-center"
                        />
                    )}
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-rp-iris" />
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-1 rounded hover:bg-rp-foam/10 text-rp-foam transition-colors
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Save changes"
                                title="Save (Ctrl+Enter)"
                            >
                                <Check className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isSaving}
                                className="p-1 rounded hover:bg-rp-love/10 text-rp-love transition-colors
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Cancel editing"
                                title="Cancel (Esc)"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
