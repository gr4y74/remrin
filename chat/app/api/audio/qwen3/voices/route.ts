/**
 * Qwen3-TTS Voices API Route
 * 
 * List available Qwen3 voices including default, cloned, and designed voices.
 * 
 * GET /api/audio/qwen3/voices
 * Query params: ?locale=en (optional language filter)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQwen3TTSProvider } from '@/lib/audio/providers/Qwen3TTSProvider';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // 1. Authenticate User (optional - public voices can be listed without auth)
        const { data: { user } } = await supabase.auth.getUser();

        // 2. Parse Query Parameters
        const { searchParams } = new URL(request.url);
        const locale = searchParams.get('locale') || undefined;
        const includeUserVoices = searchParams.get('include_user_voices') === 'true';

        // 3. Get default voices from provider
        const qwen3 = getQwen3TTSProvider();
        const defaultVoices = await qwen3.listVoices(locale);

        // 4. Get user's custom voices from database (if authenticated)
        let userVoices: any[] = [];
        if (user && includeUserVoices) {
            const { data: customVoices } = await supabase
                .from('community_voices')
                .select('*')
                .eq('voice_provider', 'qwen3')
                .or(`created_by_user_id.eq.${user.id},is_public.eq.true`)
                .order('created_at', { ascending: false });

            userVoices = (customVoices || []).map(voice => ({
                id: voice.voice_id,
                name: voice.name,
                provider: 'qwen3',
                locale: 'en-US',  // Could be stored in DB
                language: 'English',
                gender: 'unknown',
                styles: voice.design_prompt ? ['designed', 'custom'] : ['cloned', 'custom'],
                isNeural: true,
                sampleUrl: voice.sample_audio_url,
                metadata: {
                    description: voice.description,
                    is_cloned: !voice.design_prompt,
                    is_designed: !!voice.design_prompt,
                    design_prompt: voice.design_prompt,
                    created_by: voice.created_by_user_id,
                    is_own: voice.created_by_user_id === user.id,
                },
            }));
        }

        // 5. Combine and return
        const allVoices = [
            ...defaultVoices.map(v => ({ ...v, isDefault: true })),
            ...userVoices.map(v => ({ ...v, isDefault: false, isCustom: true })),
        ];

        // 6. Get supported languages
        const languages = qwen3.getSupportedLanguages();

        return NextResponse.json({
            success: true,
            voices: allVoices,
            languages,
            provider_status: await qwen3.getStatus(),
        });

    } catch (error) {
        console.error('List Voices Error:', error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to list voices' },
            { status: 500 }
        );
    }
}
