'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2, Edit2 } from 'lucide-react';

interface EditableFieldProps {
    value: string;
    onSave: (value: string) => Promise<void>;
    placeholder?: string;
    maxLength?: number;
    validate?: (value: string) => string | null;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export function EditableField({
    value,
    onSave,
    placeholder = 'Click to edit',
    maxLength,
    validate,
    label,
    disabled = false,
    className = '',
}: EditableFieldProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Update current value when prop changes
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

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
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
    };

    const handleClick = () => {
        if (!disabled && !isEditing) {
            setIsEditing(true);
        }
    };

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
                        transition-all duration-200 border border-transparent
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
                    <span className={`${value ? 'text-rp-text' : 'text-rp-subtle'}`}>
                        {value || placeholder}
                    </span>
                    {!disabled && (
                        <Edit2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-rp-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentValue}
                        onChange={(e) => {
                            setCurrentValue(e.target.value);
                            setError(null);
                        }}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSave}
                        maxLength={maxLength}
                        disabled={isSaving}
                        className="w-full bg-rp-base border border-rp-iris rounded-lg px-3 py-2 text-rp-text 
                                 focus:outline-none focus:ring-2 focus:ring-rp-iris/50 focus:border-rp-iris
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        aria-label={label}
                        aria-invalid={!!error}
                        aria-describedby={error ? 'field-error' : undefined}
                    />
                    {maxLength && (
                        <div className="text-xs text-rp-subtle mt-1 text-right">
                            {currentValue.length} / {maxLength}
                        </div>
                    )}
                    {error && (
                        <div id="field-error" className="text-xs text-rp-love mt-1" role="alert">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 pt-2">
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
                                title="Save (Enter)"
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
