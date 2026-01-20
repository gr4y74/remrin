/**
 * TTS Generation API Route
 * Accepts text and returns audio stream using ElevenLabs (primary) or OpenAI (fallback)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createElevenLabsTTS } from '@/lib/tts/elevenlabs';
import { createOpenAITTS, OpenAITTS } from '@/lib/tts/openai';

export const runtime = 'edge';

interface TTSRequest {
    text: string;
    voiceId?: string;
    provider?: 'elevenlabs' | 'openai' | 'auto';
    voice?: string; // For OpenAI
    speed?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: TTSRequest = await request.json();
        const { text, voiceId, provider = 'auto', voice, speed } = body;

        if (!text || text.trim().length === 0) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        // Limit text length to prevent abuse
        if (text.length > 5000) {
            return NextResponse.json(
                { error: 'Text too long (max 5000 characters)' },
                { status: 400 }
            );
        }

        let audioStream: ReadableStream<Uint8Array> | null = null;
        let usedProvider = '';

        // Try ElevenLabs first if available and requested
        if (provider === 'elevenlabs' || provider === 'auto') {
            const elevenLabs = createElevenLabsTTS();

            if (elevenLabs && voiceId) {
                try {
                    audioStream = await elevenLabs.generateSpeech({
                        text,
                        voiceId,
                    });
                    usedProvider = 'elevenlabs';
                } catch (error) {
                    console.error('ElevenLabs TTS error:', error);

                    // If not auto mode, return error
                    if (provider === 'elevenlabs') {
                        return NextResponse.json(
                            { error: 'ElevenLabs TTS failed' },
                            { status: 500 }
                        );
                    }
                }
            }
        }

        // Fallback to OpenAI if ElevenLabs failed or not available
        if (!audioStream && (provider === 'openai' || provider === 'auto')) {
            const openai = createOpenAITTS();

            if (openai) {
                try {
                    audioStream = await openai.generateSpeech({
                        text,
                        voice: voice as any || 'alloy',
                        speed: speed || 1.0,
                    });
                    usedProvider = 'openai';
                } catch (error) {
                    console.error('OpenAI TTS error:', error);
                    return NextResponse.json(
                        { error: 'OpenAI TTS failed' },
                        { status: 500 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'No TTS provider available' },
                    { status: 503 }
                );
            }
        }

        if (!audioStream) {
            return NextResponse.json(
                { error: 'Failed to generate audio' },
                { status: 500 }
            );
        }

        // Return audio stream with appropriate headers
        return new NextResponse(audioStream, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'X-TTS-Provider': usedProvider,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('TTS API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
