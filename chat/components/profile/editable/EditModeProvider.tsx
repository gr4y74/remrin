'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Edit3, Save, X } from 'lucide-react';

interface EditModeContextValue {
    isEditMode: boolean;
    hasUnsavedChanges: boolean;
    enterEditMode: () => void;
    exitEditMode: () => void;
    toggleEditMode: () => void;
    registerUnsavedChange: (id: string) => void;
    unregisterUnsavedChange: (id: string) => void;
    saveAll: () => Promise<void>;
}

const EditModeContext = createContext<EditModeContextValue | undefined>(undefined);

export function useEditMode() {
    const context = useContext(EditModeContext);
    if (!context) {
        throw new Error('useEditMode must be used within EditModeProvider');
    }
    return context;
}

interface EditModeProviderProps {
    children: React.ReactNode;
    onSaveAll?: () => Promise<void>;
}

export function EditModeProvider({ children, onSaveAll }: EditModeProviderProps) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    const hasUnsavedChanges = unsavedChanges.size > 0;

    const enterEditMode = useCallback(() => {
        setIsEditMode(true);
    }, []);

    const exitEditMode = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to exit edit mode?'
            );
            if (!confirmed) return;
        }
        setIsEditMode(false);
        setUnsavedChanges(new Set());
    }, [hasUnsavedChanges]);

    const toggleEditMode = useCallback(() => {
        if (isEditMode) {
            exitEditMode();
        } else {
            enterEditMode();
        }
    }, [isEditMode, enterEditMode, exitEditMode]);

    const registerUnsavedChange = useCallback((id: string) => {
        setUnsavedChanges((prev) => new Set(prev).add(id));
    }, []);

    const unregisterUnsavedChange = useCallback((id: string) => {
        setUnsavedChanges((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const saveAll = useCallback(async () => {
        if (!onSaveAll) return;

        setIsSaving(true);
        try {
            await onSaveAll();
            setUnsavedChanges(new Set());
        } catch (error) {
            console.error('Failed to save all changes:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    }, [onSaveAll]);

    // Warn before leaving page with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const value: EditModeContextValue = {
        isEditMode,
        hasUnsavedChanges,
        enterEditMode,
        exitEditMode,
        toggleEditMode,
        registerUnsavedChange,
        unregisterUnsavedChange,
        saveAll,
    };

    return (
        <EditModeContext.Provider value={value}>
            {children}

            {/* Floating Edit Mode Controls */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
                {isEditMode && hasUnsavedChanges && onSaveAll && (
                    <button
                        onClick={saveAll}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-3 bg-rp-foam text-rp-base rounded-full
                                 shadow-lg hover:bg-rp-foam/90 transition-all disabled:opacity-50
                                 disabled:cursor-not-allowed animate-in slide-in-from-bottom-5"
                        aria-label="Save all changes"
                    >
                        <Save className="w-5 h-5" />
                        <span className="font-medium">Save All</span>
                        <span className="px-2 py-0.5 bg-rp-base/20 rounded-full text-xs">
                            {unsavedChanges.size}
                        </span>
                    </button>
                )}

                <button
                    onClick={toggleEditMode}
                    className={`
                        flex items-center gap-2 px-4 py-3 rounded-full shadow-lg
                        transition-all duration-200
                        ${isEditMode
                            ? 'bg-rp-love text-white hover:bg-rp-love/90'
                            : 'bg-rp-iris text-white hover:bg-rp-iris/90'
                        }
                    `}
                    aria-label={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}
                >
                    {isEditMode ? (
                        <>
                            <X className="w-5 h-5" />
                            <span className="font-medium">Exit Edit Mode</span>
                        </>
                    ) : (
                        <>
                            <Edit3 className="w-5 h-5" />
                            <span className="font-medium">Edit Profile</span>
                        </>
                    )}
                </button>
            </div>
        </EditModeContext.Provider>
    );
}
