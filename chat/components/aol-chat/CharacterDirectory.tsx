'use client';

import React, { useState, useEffect } from 'react';
import { XPWindow } from './XPWindow';
import { XPButton } from './XPButton';
import { XPInput } from './XPInput';
import { IconSearch, IconUserPlus, IconLoader2 } from '@tabler/icons-react';

interface Character {
    id: string;
    name: string;
    description: string;
    image_url: string;
    intro_message: string;
}

interface CharacterDirectoryProps {
    onClose: () => void;
    onAddBot: (personaId: string) => Promise<void>;
}

export const CharacterDirectory: React.FC<CharacterDirectoryProps> = ({ onClose, onAddBot }) => {
    const [query, setQuery] = useState('');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    const searchCharacters = async (q: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/chat/characters/discover?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setCharacters(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        searchCharacters('');
    }, []);

    const handleAdd = async (id: string) => {
        setAddingId(id);
        await onAddBot(id);
        setAddingId(null);
    };

    return (
        <XPWindow
            title="Character Directory"
            className="w-[450px] h-[500px] shadow-2xl"
            onClose={onClose}
        >
            <div className="p-4 bg-[#f3ebf9] flex flex-col h-full overflow-hidden">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-[#5e2b8d] mb-1">Discover AI Companions</h2>
                    <p className="text-sm text-[#4b1b7a] opacity-80">Find a persona to add to your buddy list.</p>
                </div>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <XPInput
                            placeholder="Search characters..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && searchCharacters(query)}
                            className="w-full pl-9"
                        />
                        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <XPButton variant="primary" onClick={() => searchCharacters(query)}>Search</XPButton>
                </div>

                <div className="flex-1 overflow-y-auto bg-white border border-[#d8c3e8] rounded p-1 space-y-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <IconLoader2 className="animate-spin text-[#5e2b8d]" />
                        </div>
                    ) : characters.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 italic">No characters found.</div>
                    ) : (
                        characters.map(char => (
                            <div key={char.id} className="flex gap-3 p-2 hover:bg-[#f3ebf9] rounded transition-colors border-b border-[#f0f0f0]">
                                <img
                                    src={char.image_url || '/images/default-avatar.png'}
                                    alt={char.name}
                                    className="w-12 h-12 rounded-full border border-[#d8c3e8] object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-[#5e2b8d]">{char.name}</div>
                                    <div className="text-[11px] text-gray-600 line-clamp-2 leading-tight">{char.description}</div>
                                </div>
                                <div className="flex items-center">
                                    <XPButton
                                        onClick={() => handleAdd(char.id)}
                                        disabled={addingId === char.id}
                                        className="text-[10px] py-1 px-2"
                                    >
                                        <IconUserPlus size={14} className="mr-1" />
                                        {addingId === char.id ? 'Adding...' : 'Add'}
                                    </XPButton>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </XPWindow>
    );
};
