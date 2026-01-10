'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2, ChevronDown, Edit2 } from 'lucide-react';

interface SelectOption {
    value: string;
    label: string;
}

interface EditableSelectProps {
    value: string;
    options: SelectOption[];
    onSave: (value: string) => Promise<void>;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export function EditableSelect({
    value,
    options,
    onSave,
    label,
    disabled = false,
    className = '',
}: EditableSelectProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const optionsRef = useRef<HTMLDivElement>(null);

    // Update current value when prop changes
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isEditing && isOpen) {
                    handleSave();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing, isOpen, currentValue]);

    // Set focused index when opening
    useEffect(() => {
        if (isOpen) {
            const currentIndex = options.findIndex((opt) => opt.value === currentValue);
            setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
        }
    }, [isOpen, currentValue, options]);

    const handleSave = async () => {
        // Don't save if no changes
        if (currentValue === value) {
            setIsEditing(false);
            setIsOpen(false);
            return;
        }

        setIsSaving(true);
        setError(null);
        setIsOpen(false);

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
        setIsOpen(false);
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                setCurrentValue(options[focusedIndex].value);
                handleSave();
                break;
            case 'Escape':
                e.preventDefault();
                handleCancel();
                break;
        }
    };

    const handleClick = () => {
        if (!disabled && !isEditing) {
            setIsEditing(true);
            setIsOpen(true);
        }
    };

    const handleOptionClick = (optionValue: string) => {
        setCurrentValue(optionValue);
        // Auto-save on selection
        setTimeout(() => {
            handleSave();
        }, 100);
    };

    const currentLabel = options.find((opt) => opt.value === value)?.label || value;

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
                    <span className="text-rp-text">{currentLabel}</span>
                    {!disabled && (
                        <Edit2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-rp-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={className} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-rp-subtle mb-1">
                    {label}
                </label>
            )}
            <div className="flex items-start gap-2">
                <div className="flex-1 relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        disabled={isSaving}
                        className="w-full bg-rp-base border border-rp-iris rounded-lg px-3 py-2 text-rp-text 
                                 focus:outline-none focus:ring-2 focus:ring-rp-iris/50 focus:border-rp-iris
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                                 flex items-center justify-between"
                        aria-label={label}
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                    >
                        <span>{options.find((opt) => opt.value === currentValue)?.label || currentValue}</span>
                        <ChevronDown
                            className={`w-4 h-4 text-rp-subtle transition-transform ${isOpen ? 'rotate-180' : ''
                                }`}
                        />
                    </button>

                    {isOpen && (
                        <div
                            ref={optionsRef}
                            className="absolute z-50 w-full mt-1 bg-rp-surface border border-rp-iris rounded-lg 
                                     shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                            role="listbox"
                        >
                            {options.map((option, index) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleOptionClick(option.value)}
                                    className={`
                                        px-3 py-2 cursor-pointer transition-colors
                                        ${currentValue === option.value ? 'bg-rp-iris/20 text-rp-iris' : 'text-rp-text'}
                                        ${focusedIndex === index ? 'bg-rp-overlay' : ''}
                                        hover:bg-rp-overlay
                                    `}
                                    role="option"
                                    aria-selected={currentValue === option.value}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.label}</span>
                                        {currentValue === option.value && (
                                            <Check className="w-4 h-4 text-rp-iris" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="text-xs text-rp-love mt-1" role="alert">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 pt-2">
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-rp-iris" />
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
}
