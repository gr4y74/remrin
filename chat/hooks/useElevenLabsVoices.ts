// useElevenLabsVoices.ts
import { useState, useCallback } from 'react';

export interface Voice {
    id: string;
    name: string;
    creator?: string;
    language: string;
    accent?: string;
    useCases: string[];
    isPremium: boolean;
    isFavorite: boolean;
}

export interface VoiceFilters {
    category?: string;
    language?: string;
    useCase?: string;
}

/**
 * Hook to manage ElevenLabs voice data.
 * This is a simplified implementation using placeholder API endpoints.
 * In production, replace the fetch URLs with actual ElevenLabs service URLs
 * and handle authentication, rate‑limiting, and error handling accordingly.
 */
export const useElevenLabsVoices = () => {
    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<VoiceFilters>({});
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const fetchVoices = useCallback(async (overrideFilters?: VoiceFilters, overridePage?: number) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams({
                limit: pageSize.toString(),
                offset: ((overridePage ?? page) - 1).toString(),
                ...(overrideFilters ?? filters),
            } as any).toString();
            const response = await fetch(`/api/elevenlabs/voices?${query}`);
            if (!response.ok) throw new Error(`Failed to fetch voices: ${response.status}`);
            const data = await response.json();
            // Assume API returns { voices: Voice[], total: number }
            setVoices(data.voices);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    const loadVoices = useCallback(() => {
        fetchVoices();
    }, [fetchVoices]);

    const searchVoices = useCallback((query: string) => {
        // Simple client‑side filter for demo purposes
        const filtered = voices.filter((v) => v.name.toLowerCase().includes(query.toLowerCase()));
        setVoices(filtered);
    }, [voices]);

    const toggleFavorite = useCallback(async (voiceId: string) => {
        // Optimistic UI update
        setVoices((prev) =>
            prev.map((v) => (v.id === voiceId ? { ...v, isFavorite: !v.isFavorite } : v))
        );
        try {
            await fetch(`/api/elevenlabs/voices/${voiceId}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
        } catch {
            // Revert on error
            setVoices((prev) =>
                prev.map((v) => (v.id === voiceId ? { ...v, isFavorite: !v.isFavorite } : v))
            );
        }
    }, []);

    const previewVoice = useCallback(async (voiceId: string) => {
        // In a real app this would stream audio; here we just trigger a fetch
        try {
            const res = await fetch(`/api/elevenlabs/voices/${voiceId}/preview`);
            if (!res.ok) throw new Error('Preview failed');
            // The response could be an audio blob; for demo we ignore it
        } catch (e) {
            console.error(e);
        }
    }, []);

    const setPageNumber = useCallback((newPage: number) => {
        setPage(newPage);
        fetchVoices(undefined, newPage);
    }, [fetchVoices]);

    return {
        voices,
        loading,
        error,
        filters,
        setFilters,
        loadVoices,
        searchVoices,
        toggleFavorite,
        previewVoice,
        page,
        setPage: setPageNumber,
    };
};
