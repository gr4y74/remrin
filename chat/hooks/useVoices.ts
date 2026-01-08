"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Voice, VoiceFilter, VoiceProvider } from '@/types/audio';
import { toast } from 'sonner';

interface UseVoicesReturn {
    voices: Voice[];
    isLoading: boolean;
    error: string | null;
    selectedVoiceId: string | null;
    setSelectedVoiceId: (id: string | null) => void;
    favorites: string[]; // Voice IDs
    toggleFavorite: (voiceId: string) => void;
    filters: VoiceFilter;
    setFilters: (filters: VoiceFilter) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    playPreview: (voice: Voice) => Promise<void>;
    isPlaying: boolean;
    currentPlayingId: string | null;
}

const FAVORITES_KEY = 'remrin_voice_favorites';
const RECENT_KEY = 'remrin_voice_recent';

export function useVoices(initialProvider: VoiceProvider = 'edge'): UseVoicesReturn {
    const [allVoices, setAllVoices] = useState<Voice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

    // Filtering State
    const [filters, setFilters] = useState<VoiceFilter>({
        provider: initialProvider
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Favorites State
    const [favorites, setFavorites] = useState<string[]>([]);

    // Playback State
    const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        loadVoices();

        // Load favorites
        try {
            const saved = localStorage.getItem(FAVORITES_KEY);
            if (saved) {
                setFavorites(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to load favorites', e);
        }
    }, []);

    const loadVoices = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filters.provider) params.append('provider', filters.provider);

            const res = await fetch(`/api/audio/voices?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch voices');

            const data = await res.json();
            setAllVoices(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            toast.error('Could not load voices');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFavorite = useCallback((voiceId: string) => {
        setFavorites(prev => {
            const newFavs = prev.includes(voiceId)
                ? prev.filter(id => id !== voiceId)
                : [...prev, voiceId];

            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
            return newFavs;
        });
    }, []);

    const playPreview = useCallback(async (voice: Voice) => {
        // Stop current if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            if (currentPlayingId === voice.id) {
                setIsPlaying(false);
                setCurrentPlayingId(null);
                setCurrentAudio(null);
                return;
            }
        }

        // Logic to get preview URL
        // If voice has a previewUrl, use it. 
        // Otherwise, we might need to synthesize a sample (not implemented in this hook directly without an endpoint)
        // For now, we simulate a failure or play a dummy if provided

        const url = voice.previewUrl;

        if (!url) {
            toast.info("Preview not available for this voice yet.");
            return;
        }

        try {
            const audio = new Audio(url);
            audio.onended = () => {
                setIsPlaying(false);
                setCurrentPlayingId(null);
                setCurrentAudio(null);
            };
            audio.onerror = () => {
                setIsPlaying(false);
                setCurrentPlayingId(null);
                setCurrentAudio(null);
                toast.error("Failed to play preview");
            };

            setCurrentAudio(audio);
            setCurrentPlayingId(voice.id);
            setIsPlaying(true);
            await audio.play();
        } catch (e) {
            console.error("Playback error", e);
            toast.error("Could not play audio");
        }
    }, [currentAudio, currentPlayingId]);

    // Derived state for filtered voices
    const voices = useMemo(() => {
        return allVoices.filter(voice => {
            // Provider filter (already mostly handled by API but good to enforce)
            if (filters.provider && voice.provider !== filters.provider) return false;

            // Gender filter
            if (filters.gender && voice.gender !== filters.gender) return false;

            // Language filter
            if (filters.language && !voice.locale.includes(filters.language)) return false;

            // Search query (name or tags)
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = voice.name.toLowerCase().includes(q);
                const matchTag = voice.tags?.some(tag => tag.toLowerCase().includes(q));
                const matchLang = voice.language.toLowerCase().includes(q);
                return matchName || matchTag || matchLang;
            }

            return true;
        });
    }, [allVoices, filters, searchQuery]);

    return {
        voices,
        isLoading,
        error,
        selectedVoiceId,
        setSelectedVoiceId,
        favorites,
        toggleFavorite,
        filters,
        setFilters,
        searchQuery,
        setSearchQuery,
        playPreview,
        isPlaying,
        currentPlayingId
    };
}
