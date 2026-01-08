/**
 * TTS Audio Generation API Route
 * 
 * POST /api/audio/generate
 * Generates text-to-speech audio with intelligent caching via AudioService
 * 
 * Features:
 * - Multi-provider TTS support (Edge, Kokoro, ElevenLabs)
 * - Intelligent cache lookup and storage
 * - Text hash-based deduplication
 * - Hit count tracking
 * - Fallback to persona voice settings
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
    ttsGenerateSchema,
    AudioAPIError,
    type TTSGenerateResponse,
} from '@/types/audio';
import { getAudioService } from '@/lib/audio/AudioService';

/**
 * POST: Generate TTS audio with caching
 */
export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[TTS Generate] Authentication failed:', authError);
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as TTSGenerateResponse,
                { status: 401 }
            );
        }

        // Parse and validate request
        const body = await request.json();
        const validationResult = ttsGenerateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request',
                    cached: false,
                } as TTSGenerateResponse,
                { status: 400 }
            );
        }

        const { text, personaId, voiceId, provider, settings } = validationResult.data;

        // Use AudioService for generation logic (handles caching, providers, and fallbacks)
        const audioService = getAudioService();

        const result = await audioService.generateSpeech({
            text,
            personaId,
            voiceId,
            provider,
            options: settings,
            userId: user.id
        });

        return NextResponse.json(
            {
                success: true,
                audioUrl: result.audioUrl,
                cached: result.cached,
                duration: result.duration,
            } as TTSGenerateResponse,
            { status: 200 }
        );

    } catch (error) {
        console.error('[TTS Generate] Unexpected error:', error);

        if (error instanceof AudioAPIError) {
            return NextResponse.json(
                { success: false, error: error.message, cached: false } as TTSGenerateResponse,
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error', cached: false } as TTSGenerateResponse,
            { status: 500 }
        );
    }
}

