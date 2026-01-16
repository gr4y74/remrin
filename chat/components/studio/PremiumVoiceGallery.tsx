// PremiumVoiceGallery.tsx
import React, { useEffect, useState } from 'react';
import { VoiceCard } from './VoiceCard';
import { useElevenLabsVoices } from '../../hooks/useElevenLabsVoices';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

export const PremiumVoiceGallery: React.FC = () => {
    const {
        voices,
        loading,
        error,
        loadVoices,
        previewVoice,
        toggleFavorite,
        filters,
        setFilters,
    } = useElevenLabsVoices();

    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        loadVoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePreview = (voiceId: string) => previewVoice(voiceId);
    const handleFavorite = (voiceId: string) => toggleFavorite(voiceId);

    const categories = ['Narration', 'Conversational', 'Characters', 'Ads'];
    const languages = ['English', 'Spanish', 'French', 'German'];
    const useCases = ['Storytelling', 'Gaming', 'Education', 'Marketing'];

    const applyFilter = (type: keyof typeof filters, value: string) => {
        setFilters({
            ...filters,
            [type]: filters[type] === value ? '' : value,
        });
        loadVoices();
    };

    return (
        <div className="premium-voice-gallery p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">ElevenLabs Premium Voices</h2>

            {/* Filter Bar */}
            <div className="mb-4">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
                >
                    {showFilters ? <IconChevronUp className="h-4 w-4" /> : <IconChevronDown className="h-4 w-4" />} Filters
                </button>
                {showFilters && (
                    <div className="grid grid-cols-3 gap-4 mt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Category</label>
                            <select
                                className="mt-1 block w-full border-gray-300 rounded"
                                value={filters.category}
                                onChange={(e) => applyFilter('category', e.target.value)}
                            >
                                <option value="">All</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Language</label>
                            <select
                                className="mt-1 block w-full border-gray-300 rounded"
                                value={filters.language}
                                onChange={(e) => applyFilter('language', e.target.value)}
                            >
                                <option value="">All</option>
                                {languages.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Use Case</label>
                            <select
                                className="mt-1 block w-full border-gray-300 rounded"
                                value={filters.useCase}
                                onChange={(e) => applyFilter('useCase', e.target.value)}
                            >
                                <option value="">All</option>
                                {useCases.map((u) => (
                                    <option key={u} value={u}>
                                        {u}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {loading && <p className="text-gray-600">Loading voices…</p>}
            {error && <p className="text-red-500">Error loading voices: {error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voices.map((v) => (
                    <VoiceCard
                        key={v.id}
                        voiceId={v.id}
                        name={v.name}
                        creator={v.creator}
                        language={v.language}
                        accent={v.accent}
                        useCases={v.useCases}
                        isPremium={v.isPremium}
                        isFavorite={v.isFavorite}
                        onPreview={handlePreview}
                        onToggleFavorite={handleFavorite}
                    />
                ))}
            </div>
        </div>
    );
};
