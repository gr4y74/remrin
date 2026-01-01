'use client';

import React, { useState, useEffect } from 'react';
import {
    IconGlobe,
    IconLock,
    IconChevronDown,
    IconCheck,
    IconUser,
    IconSearch
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPersonasByOwnerId } from '@/db/personas';
import { toast } from 'sonner';

interface MemorySharingProps {
    memoryId: string;
    initialSharedWithAll: boolean;
    initialPersonaIds: string[];
    userId: string;
    onUpdate: (sharedWithAll: boolean, personaIds: string[]) => void;
}

export const MemorySharing: React.FC<MemorySharingProps> = ({
    memoryId,
    initialSharedWithAll,
    initialPersonaIds,
    userId,
    onUpdate,
}) => {
    const [isSharedWithAll, setIsSharedWithAll] = useState(initialSharedWithAll);
    const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(initialPersonaIds);
    const [personas, setPersonas] = useState<any[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPersonas = async () => {
            if (userId) {
                const data = await getPersonasByOwnerId(userId);
                setPersonas(data);
            }
        };
        fetchPersonas();
    }, [userId]);

    const handleToggleAll = async (checked: boolean) => {
        setIsSharedWithAll(checked);
        updateSharing(checked, selectedPersonaIds);
    };

    const togglePersona = (personaId: string) => {
        const newSelection = selectedPersonaIds.includes(personaId)
            ? selectedPersonaIds.filter(id => id !== personaId)
            : [...selectedPersonaIds, personaId];

        setSelectedPersonaIds(newSelection);
        updateSharing(isSharedWithAll, newSelection);
    };

    const updateSharing = async (sharedAll: boolean, pIds: string[]) => {
        setSaving(true);
        try {
            const res = await fetch('/api/v2/knowledge', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: memoryId,
                    shared_with_all: sharedAll,
                    persona_ids: pIds
                })
            });

            if (!res.ok) throw new Error('Failed to update sharing settings');

            onUpdate(sharedAll, pIds);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save sharing settings');
        } finally {
            setSaving(false);
        }
    };

    const filteredPersonas = personas.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isSharedWithAll ? (
                        <IconGlobe size={16} className="text-blue-400" />
                    ) : (
                        <IconLock size={16} className="text-white/40" />
                    )}
                    <span className="text-sm font-medium text-white/80">
                        {isSharedWithAll ? 'Shared with all Souls' : 'Private / Selective'}
                    </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isSharedWithAll}
                        onChange={(e) => handleToggleAll(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <AnimatePresence>
                {!isSharedWithAll && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <IconUser size={16} />
                                    {selectedPersonaIds.length === 0
                                        ? 'Select specific Souls...'
                                        : `${selectedPersonaIds.length} Souls selected`}
                                </div>
                                <IconChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                                >
                                    <div className="p-2 border-b border-white/10">
                                        <div className="relative">
                                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                                            <input
                                                type="text"
                                                placeholder="Search Souls..."
                                                className="w-full bg-white/5 rounded-lg py-1.5 pl-9 pr-3 text-sm text-white focus:outline-none focus:ring-1 ring-blue-500/50"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto p-1">
                                        {filteredPersonas.map(persona => (
                                            <button
                                                key={persona.id}
                                                onClick={() => togglePersona(persona.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
                                            >
                                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white/10">
                                                    {persona.image_url ? (
                                                        <img src={persona.image_url} alt={persona.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <IconUser size={16} className="absolute inset-0 m-auto text-white/20" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{persona.name}</p>
                                                </div>
                                                {selectedPersonaIds.includes(persona.id) && (
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <IconCheck size={12} className="text-white" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                        {filteredPersonas.length === 0 && (
                                            <div className="p-4 text-center text-xs text-white/40 italic">
                                                No Souls found
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {saving && (
                <div className="text-[10px] text-blue-400 animate-pulse self-end flex items-center gap-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />
                    Saving settings...
                </div>
            )}
        </div>
    );
};
