/**
 * Qwen3-TTS Voice Design API Route
 * 
 * Create a custom voice from a natural language description.
 * This is a unique feature of Qwen3-TTS that allows users to describe
 * the voice they want (e.g., "a warm, playful anime girl voice")
 * and have it generated automatically.
 * 
 * POST /api/audio/qwen3/design
 * Body: { name: string, description: string, language?: string, gender?: 'male' | 'female' }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQwen3TTSProvider } from '@/lib/audio/providers/Qwen3TTSProvider';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 1. Authenticate User
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Request Body
        const body = await request.json();
        const { name, description, language, gender } = body;

        // 3. Validation
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Voice name is required' }, { status: 400 });
        }

        if (!description || typeof description !== 'string') {
            return NextResponse.json({ error: 'Voice description is required' }, { status: 400 });
        }

        if (description.length < 10) {
            return NextResponse.json({
                error: 'Description too short. Please provide a detailed description of the voice.'
            }, { status: 400 });
        }

        if (description.length > 500) {
            return NextResponse.json({
                error: 'Description too long. Maximum 500 characters.'
            }, { status: 400 });
        }

        // 4. Call Qwen3 Provider to design voice
        const qwen3 = getQwen3TTSProvider();
        const result = await qwen3.designVoice(description, name, {
            language: language || 'en',
            gender: gender as 'male' | 'female' | undefined,
        });

        // 5. Generate a preview sample
        let previewUrl: string | undefined;
        try {
            previewUrl = await qwen3.generatePreview(result.voiceId);
        } catch (previewError) {
            console.warn('Failed to generate preview:', previewError);
            // Continue without preview
        }

        // 6. Save to Database
        const { data: voiceData, error: dbError } = await supabase
            .from('community_voices')
            .insert({
                name,
                description,
                voice_provider: 'qwen3',
                voice_id: result.voiceId,
                sample_audio_url: previewUrl || result.previewUrl,
                created_by_user_id: user.id,
                is_public: false,
                usage_count: 0,
                design_prompt: description,  // Store the prompt for reference
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: 'Failed to save voice record' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            voice_id: result.voiceId,
            preview_url: previewUrl || result.previewUrl,
            voice: voiceData,
        });

    } catch (error) {
        console.error('Voice Design Error:', error);

        if (error instanceof Error && error.message.includes('API key')) {
            return NextResponse.json(
                { error: 'Qwen3-TTS API key not configured. Please contact support.' },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to design voice' },
            { status: 500 }
        );
    }
}
