import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInlineEditOptions<T> {
    initialValue: T;
    onSave: (value: T) => Promise<void>;
    validate?: (value: T) => string | null;
    debounceMs?: number;
}

interface UseInlineEditReturn<T> {
    value: T;
    isEditing: boolean;
    isSaving: boolean;
    error: string | null;
    hasChanges: boolean;
    startEditing: () => void;
    cancelEditing: () => void;
    setValue: (value: T) => void;
    save: () => Promise<void>;
    reset: () => void;
}

export function useInlineEdit<T>({
    initialValue,
    onSave,
    validate,
    debounceMs = 0,
}: UseInlineEditOptions<T>): UseInlineEditReturn<T> {
    const [value, setValue] = useState<T>(initialValue);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedValue, setSavedValue] = useState<T>(initialValue);

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const savePromiseRef = useRef<Promise<void> | null>(null);

    // Update initial value when it changes externally
    useEffect(() => {
        setValue(initialValue);
        setSavedValue(initialValue);
    }, [initialValue]);

    const hasChanges = value !== savedValue;

    const startEditing = useCallback(() => {
        setIsEditing(true);
        setError(null);
    }, []);

    const cancelEditing = useCallback(() => {
        setValue(savedValue);
        setIsEditing(false);
        setError(null);

        // Clear any pending debounced saves
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, [savedValue]);

    const save = useCallback(async () => {
        // Clear any pending debounced saves
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }

        // Validate if validator provided
        if (validate) {
            const validationError = validate(value);
            if (validationError) {
                setError(validationError);
                return;
            }
        }

        // Don't save if no changes
        if (value === savedValue) {
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Optimistic update
            const previousValue = savedValue;
            setSavedValue(value);

            // Perform save
            await onSave(value);

            setIsEditing(false);
        } catch (err) {
            // Rollback on error
            setValue(savedValue);
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    }, [value, savedValue, validate, onSave]);

    const debouncedSave = useCallback(() => {
        if (debounceMs > 0) {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                save();
            }, debounceMs);
        } else {
            save();
        }
    }, [save, debounceMs]);

    const reset = useCallback(() => {
        setValue(initialValue);
        setSavedValue(initialValue);
        setIsEditing(false);
        setError(null);
        setIsSaving(false);

        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
        }
    }, [initialValue]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        value,
        isEditing,
        isSaving,
        error,
        hasChanges,
        startEditing,
        cancelEditing,
        setValue,
        save,
        reset,
    };
}
