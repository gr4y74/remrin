
import { NextResponse } from 'next/server';
import { Voice } from '@/types/audio'; // Using existing type definition
import { createClient } from '@/lib/supabase/server';

// Static list of popular Edge TTS voices
const EDGE_VOICES: Voice[] = [
    {
        id: 'en-US-AriaNeural',
        name: 'Aria',
        gender: 'Female',
        language: 'English (US)',
        locale: 'en-US',
        provider: 'edge',
        tags: ['Cheerful', 'News'],
        sampleRate: 24000,
        description: 'Friendly and versatile American female voice',
        isNeural: true,
        styles: ['Cheerful', 'News']
    },
    {
        id: 'en-US-GuyNeural',
        name: 'Guy',
        gender: 'Male',
        language: 'English (US)',
        locale: 'en-US',
        provider: 'edge',
        tags: ['News', 'Professional'],
        sampleRate: 24000,
        description: 'Professional American male voice',
        isNeural: true,
        styles: ['News', 'Professional']
    },
    {
        id: 'en-US-JennyNeural',
        name: 'Jenny',
        gender: 'Female',
        language: 'English (US)',
        locale: 'en-US',
        provider: 'edge',
        tags: ['Conversational', 'Warm'],
        sampleRate: 24000,
        description: 'Warm and conversational American female voice',
        isNeural: true,
        styles: ['Conversational', 'Warm']
    },
    {
        id: 'en-GB-SoniaNeural',
        name: 'Sonia',
        gender: 'Female',
        language: 'English (UK)',
        locale: 'en-GB',
        provider: 'edge',
        tags: ['Cheerful', 'British'],
        sampleRate: 24000,
        description: 'Bright British female voice',
        isNeural: true,
        styles: ['Cheerful', 'British']
    },
    {
        id: 'en-GB-RyanNeural',
        name: 'Ryan',
        gender: 'Male',
        language: 'English (UK)',
        locale: 'en-GB',
        provider: 'edge',
        tags: ['Professional', 'British'],
        sampleRate: 24000,
        description: 'Clear British male voice',
        isNeural: true,
        styles: ['Professional', 'British']
    },
    {
        id: 'ja-JP-NanamiNeural',
        name: 'Nanami',
        gender: 'Female',
        language: 'Japanese',
        locale: 'ja-JP',
        provider: 'edge',
        tags: ['Anime', 'Soft'],
        sampleRate: 24000,
        description: 'Popular Japanese female voice',
        isNeural: true,
        styles: ['Anime', 'Soft']
    },
    {
        id: 'ja-JP-KeitaNeural',
        name: 'Keita',
        gender: 'Male',
        language: 'Japanese',
        locale: 'ja-JP',
        provider: 'edge',
        tags: ['Anime', 'Young'],
        sampleRate: 24000,
        description: 'Young Japanese male voice',
        isNeural: true,
        styles: ['Anime', 'Young']
    },
    {
        id: 'fr-FR-DeniseNeural',
        name: 'Denise',
        gender: 'Female',
        language: 'French',
        locale: 'fr-FR',
        provider: 'edge',
        tags: ['Soft', 'French'],
        sampleRate: 24000,
        isNeural: true,
        styles: []
    },
    {
        id: 'de-DE-KatjaNeural',
        name: 'Katja',
        gender: 'Female',
        language: 'German',
        locale: 'de-DE',
        provider: 'edge',
        tags: ['Professional', 'German'],
        sampleRate: 24000,
        isNeural: true,
        styles: []
    }
];

// Cache duration in seconds (1 hour)
const CACHE_MAX_AGE = 3600;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');
        const language = searchParams.get('language');
        const gender = searchParams.get('gender');
        const type = searchParams.get('type');

        // Handle Community Voices
        if (type === 'community') {
            const supabase = createClient();

            // Start building the query
            let query = supabase
                .from('community_voices')
                .select(`
                    *,
                    profiles:created_by_user_id (
                        display_name
                    )
                `);

            // Apply filtering
            if (provider) {
                query = query.eq('voice_provider', provider);
            }

            // For now, return all public voices. 
            // In a real app, we'd might want to include private voices created by current user.
            // But we can keep it simple as "Community Library" = Public.
            query = query.eq('is_public', true);

            // Order by usage count (popularity)
            query = query.order('usage_count', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error('Database Error:', error);
                throw error;
            }

            // Transform to expected format (mix of Voice interface and CommunityVoice props)
            const voices = data.map(v => ({
                id: v.voice_id, // Use TTS ID for generation
                name: v.name,
                description: v.description,
                provider: v.voice_provider,
                locale: 'en-US', // Default metadata not always in DB
                language: 'English',
                gender: 'unknown',
                styles: ['cloned'],
                isNeural: true,
                previewUrl: v.sample_audio_url, // For VoiceCard
                sampleUrl: v.sample_audio_url,   // For Voice interface
                usageCount: v.usage_count,
                authorName: v.profiles?.display_name || 'Anonymous',
                isPublic: v.is_public
            }));

            return NextResponse.json(voices, {
                headers: {
                    'Cache-Control': `public, s-maxage=60, stale-while-revalidate=30`,
                },
            });
        }

        // Handle Standard/Edge Voices
        let filteredVoices = [...EDGE_VOICES];

        // Apply filters
        if (provider) {
            filteredVoices = filteredVoices.filter(v => v.provider === provider);
        }
        if (language) {
            filteredVoices = filteredVoices.filter(v => v.locale.includes(language));
        }
        if (gender) {
            filteredVoices = filteredVoices.filter(v => v.gender.toLowerCase() === gender.toLowerCase());
        }

        // Return response with cache headers
        return NextResponse.json(filteredVoices, {
            headers: {
                'Cache-Control': `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=60`,
            },
        });
    } catch (error) {
        console.error('Error fetching voices:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voices' },
            { status: 500 }
        );
    }
}
