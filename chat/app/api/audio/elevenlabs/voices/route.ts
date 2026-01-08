/**
 * ElevenLabs Voice Library API Route
 * 
 * GET /api/audio/elevenlabs/voices
 * Returns available ElevenLabs voices with filtering and caching
 * 
 * Features:
 * - Voice library browsing
 * - Category/language/use case filtering
 * - 1-hour cache for performance
 * - Preview URLs included
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getElevenLabsProvider } from '@/lib/audio/providers/ElevenLabsProvider';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

const querySchema = z.object({
    category: z.string().optional(),
    language: z.string().optional(),
    useCase: z.string().optional(),
    gender: z.enum(['male', 'female', 'neutral']).optional(),
    search: z.string().optional(),
    includeShared: z.enum(['true', 'false']).optional().default('true'),
});

interface ElevenLabsVoiceResponse {
    id: string;
    name: string;
    provider: 'elevenlabs';
    locale: string;
    language: string;
    gender: string;
    category?: string;
    description?: string;
    previewUrl?: string;
    labels?: Record<string, string>;
    useCase?: string;
    accent?: string;
    age?: string;
}

interface VoicesAPIResponse {
    success: boolean;
    voices?: ElevenLabsVoiceResponse[];
    total?: number;
    cached?: boolean;
    error?: string;
}

// ============================================================================
// In-Memory Cache
// ============================================================================

interface CacheEntry {
    voices: ElevenLabsVoiceResponse[];
    timestamp: number;
}

const voiceCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

function getCacheKey(includeShared: boolean): string {
    return `voices-${includeShared}`;
}

function getCachedVoices(includeShared: boolean): ElevenLabsVoiceResponse[] | null {
    const key = getCacheKey(includeShared);
    const cached = voiceCache.get(key);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.voices;
    }

    return null;
}

function setCachedVoices(voices: ElevenLabsVoiceResponse[], includeShared: boolean): void {
    const key = getCacheKey(includeShared);
    voiceCache.set(key, {
        voices,
        timestamp: Date.now(),
    });
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<VoicesAPIResponse>> {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[ElevenLabs Voices] Authentication failed:', authError);
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse query parameters
        const { searchParams } = request.nextUrl;
        const queryResult = querySchema.safeParse({
            category: searchParams.get('category') || undefined,
            language: searchParams.get('language') || undefined,
            useCase: searchParams.get('useCase') || undefined,
            gender: searchParams.get('gender') || undefined,
            search: searchParams.get('search') || undefined,
            includeShared: searchParams.get('includeShared') || 'true',
        });

        if (!queryResult.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid query parameters' },
                { status: 400 }
            );
        }

        const { category, language, useCase, gender, search, includeShared } = queryResult.data;
        const shouldIncludeShared = includeShared === 'true';

        // Check cache first
        let voices = getCachedVoices(shouldIncludeShared);
        let fromCache = false;

        if (voices) {
            fromCache = true;
            console.log(`[ElevenLabs Voices] Serving ${voices.length} voices from cache`);
        } else {
            // Fetch from ElevenLabs API
            const provider = getElevenLabsProvider();

            try {
                const rawVoices = await provider.listVoicesExtended(shouldIncludeShared);

                voices = rawVoices.map((voice) => ({
                    id: voice.id,
                    name: voice.name,
                    provider: 'elevenlabs' as const,
                    locale: voice.locale,
                    language: voice.language,
                    gender: voice.gender,
                    category: (voice.metadata as Record<string, unknown>)?.category as string | undefined,
                    description: (voice.metadata as Record<string, unknown>)?.description as string | undefined,
                    previewUrl: voice.sampleUrl,
                    labels: (voice.metadata as Record<string, unknown>)?.labels as Record<string, string> | undefined,
                    useCase: ((voice.metadata as Record<string, unknown>)?.labels as Record<string, string>)?.use_case,
                    accent: ((voice.metadata as Record<string, unknown>)?.labels as Record<string, string>)?.accent,
                    age: ((voice.metadata as Record<string, unknown>)?.labels as Record<string, string>)?.age,
                }));

                // Cache the results
                setCachedVoices(voices, shouldIncludeShared);
                console.log(`[ElevenLabs Voices] Fetched and cached ${voices.length} voices`);
            } catch (error) {
                console.error('[ElevenLabs Voices] Failed to fetch voices:', error);
                return NextResponse.json(
                    {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to fetch voices'
                    },
                    { status: 500 }
                );
            }
        }

        // Apply filters
        let filteredVoices = voices;

        if (category) {
            filteredVoices = filteredVoices.filter(
                (v) => v.category?.toLowerCase() === category.toLowerCase()
            );
        }

        if (language) {
            filteredVoices = filteredVoices.filter(
                (v) => v.language.toLowerCase().includes(language.toLowerCase()) ||
                    v.locale.toLowerCase().includes(language.toLowerCase())
            );
        }

        if (useCase) {
            filteredVoices = filteredVoices.filter(
                (v) => v.useCase?.toLowerCase().includes(useCase.toLowerCase())
            );
        }

        if (gender) {
            filteredVoices = filteredVoices.filter(
                (v) => v.gender.toLowerCase() === gender.toLowerCase()
            );
        }

        if (search) {
            const searchLower = search.toLowerCase();
            filteredVoices = filteredVoices.filter(
                (v) =>
                    v.name.toLowerCase().includes(searchLower) ||
                    v.description?.toLowerCase().includes(searchLower) ||
                    v.accent?.toLowerCase().includes(searchLower)
            );
        }

        return NextResponse.json(
            {
                success: true,
                voices: filteredVoices,
                total: filteredVoices.length,
                cached: fromCache,
            },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'private, max-age=3600',
                },
            }
        );

    } catch (error) {
        console.error('[ElevenLabs Voices] Unexpected error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error'
            },
            { status: 500 }
        );
    }
}
