/**
 * Voice Clone API Route
 * 
 * Clone a voice from an audio sample using multiple providers:
 * - Qwen3-TTS: 3-30 seconds recommended, supports 10 languages
 * - ElevenLabs: 30-60 seconds recommended, premium tier
 * - Kokoro: Local cloning when available
 * 
 * POST /api/audio/clone
 * Body (FormData): file, name, description, provider (optional)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getKokoroProvider } from '@/lib/audio/providers/KokoroProvider';
import { getQwen3TTSProvider } from '@/lib/audio/providers/Qwen3TTSProvider';
import { getElevenLabsProvider } from '@/lib/audio/providers/ElevenLabsProvider';
import { cookies } from 'next/headers';
import { VoiceProvider } from '@/types/audio';

// Supported cloning providers
const CLONING_PROVIDERS = ['qwen3', 'elevenlabs', 'kokoro'] as const;
type CloningProvider = typeof CLONING_PROVIDERS[number];

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Form Data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;
        const provider = (formData.get('provider') as CloningProvider) || 'qwen3';

        // 3. Validation
        if (!file || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size exceeds limit (10MB)' }, { status: 400 });
        }

        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-wav'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        if (!CLONING_PROVIDERS.includes(provider)) {
            return NextResponse.json({
                error: `Invalid provider. Supported: ${CLONING_PROVIDERS.join(', ')}`
            }, { status: 400 });
        }

        // 4. Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('voice_samples')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload audio file' }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('voice_samples')
            .getPublicUrl(fileName);

        // 5. Call provider to clone voice
        let voiceId: string;
        let usedProvider: VoiceProvider = provider;

        try {
            switch (provider) {
                case 'qwen3': {
                    const qwen3 = getQwen3TTSProvider();
                    voiceId = await qwen3.cloneVoice(publicUrl, name, description);
                    break;
                }
                case 'elevenlabs': {
                    const elevenlabs = getElevenLabsProvider();
                    voiceId = await elevenlabs.cloneVoice(publicUrl, name, description);
                    break;
                }
                case 'kokoro': {
                    const kokoro = getKokoroProvider();
                    if (typeof (kokoro as any).cloneVoice === 'function') {
                        voiceId = await (kokoro as any).cloneVoice(name, publicUrl);
                    } else {
                        // Fallback ID generation if Kokoro doesn't support cloning
                        voiceId = `kokoro_${user.id}_${Date.now()}`;
                    }
                    break;
                }
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }
        } catch (cloneError) {
            console.error(`Clone Error (${provider}):`, cloneError);

            // Try fallback to Qwen3 if primary provider fails
            if (provider !== 'qwen3' && process.env.QWEN_API_KEY) {
                console.log('Falling back to Qwen3-TTS...');
                try {
                    const qwen3 = getQwen3TTSProvider();
                    voiceId = await qwen3.cloneVoice(publicUrl, name, description);
                    usedProvider = 'qwen3';
                } catch (fallbackError) {
                    throw cloneError; // Re-throw original error
                }
            } else {
                throw cloneError;
            }
        }

        // 6. Save to Database
        const { data: voiceData, error: dbError } = await supabase
            .from('community_voices')
            .insert({
                name,
                description,
                voice_provider: usedProvider,
                voice_id: voiceId,
                sample_audio_url: publicUrl,
                created_by_user_id: user.id,
                is_public: false,
                usage_count: 0
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: 'Failed to save voice record' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            voice_id: voiceId,
            provider: usedProvider,
            voice: voiceData,
        });

    } catch (error) {
        console.error('Clone Error:', error);

        if (error instanceof Error && error.message.includes('API key')) {
            return NextResponse.json(
                { error: 'Voice cloning API not configured. Please try a different provider.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to clone voice' },
            { status: 500 }
        );
    }
}
