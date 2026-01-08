/**
 * Persona Audio Settings API Route
 * 
 * GET /api/audio/[personaId] - Fetch persona audio settings
 * PUT /api/audio/[personaId] - Update voice settings
 * DELETE /api/audio/[personaId] - Remove welcome audio
 * 
 * Features:
 * - Retrieve voice provider and settings
 * - Update TTS voice configuration
 * - Delete welcome audio files
 * - Permission validation
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
    voiceSettingsUpdateSchema,
    AudioAPIError,
    type PersonaAudioSettings,
} from '@/types/audio';

interface RouteContext {
    params: Promise<{
        personaId: string;
    }>;
}

/**
 * GET: Fetch persona audio settings
 * 
 * Response:
 * - voice_provider: string | null
 * - voice_id: string | null
 * - voice_settings: object | null
 * - welcome_audio_url: string | null
 */
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { personaId } = await context.params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log(`[Audio Settings] Fetching settings for persona ${personaId}`);

        // Fetch persona audio settings
        const { data: persona, error: fetchError } = await supabase
            .from('personas')
            .select('voice_provider, voice_id, voice_settings, welcome_audio_url')
            .eq('id', personaId)
            .single();

        if (fetchError || !persona) {
            console.error('[Audio Settings] Persona not found:', fetchError);
            return NextResponse.json(
                { error: 'Persona not found' },
                { status: 404 }
            );
        }

        const settings: PersonaAudioSettings = {
            voice_provider: persona.voice_provider,
            voice_id: persona.voice_id,
            voice_settings: persona.voice_settings,
            welcome_audio_url: persona.welcome_audio_url,
        };

        return NextResponse.json(settings, { status: 200 });

    } catch (error) {
        console.error('[Audio Settings] GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PUT: Update voice settings for a persona
 * 
 * Request Body:
 * - voice_provider?: 'edge' | 'kokoro' | 'elevenlabs'
 * - voice_id?: string
 * - voice_settings?: object
 * 
 * Response:
 * - success: boolean
 * - error?: string
 */
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { personaId } = await context.params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validationResult = voiceSettingsUpdateSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid request body', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const updates = validationResult.data;

        console.log(`[Audio Settings] Updating settings for persona ${personaId}:`, updates);

        // Verify persona exists and user has permission
        const { data: persona, error: personaError } = await supabase
            .from('personas')
            .select('id, user_id')
            .eq('id', personaId)
            .single();

        if (personaError || !persona) {
            console.error('[Audio Settings] Persona not found:', personaError);
            return NextResponse.json(
                { error: 'Persona not found' },
                { status: 404 }
            );
        }

        // Check ownership
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.is_admin || false;

        if (persona.user_id !== user.id && !isAdmin) {
            console.error(`[Audio Settings] Permission denied for user ${user.id}`);
            return NextResponse.json(
                { error: 'Permission denied' },
                { status: 403 }
            );
        }

        // Build update object
        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (updates.voice_provider !== undefined) {
            updateData.voice_provider = updates.voice_provider;
        }
        if (updates.voice_id !== undefined) {
            updateData.voice_id = updates.voice_id;
        }
        if (updates.voice_settings !== undefined) {
            updateData.voice_settings = updates.voice_settings;
        }

        // Update persona
        const { error: updateError } = await supabase
            .from('personas')
            .update(updateData)
            .eq('id', personaId);

        if (updateError) {
            console.error('[Audio Settings] Update failed:', updateError);
            throw new AudioAPIError('Failed to update settings', 500, 'UPDATE_FAILED');
        }

        console.log(`[Audio Settings] Successfully updated persona ${personaId}`);

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );

    } catch (error) {
        console.error('[Audio Settings] PUT error:', error);

        if (error instanceof AudioAPIError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE: Remove welcome audio for a persona
 * 
 * Response:
 * - success: boolean
 * - error?: string
 */
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { personaId } = await context.params;
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log(`[Audio Settings] Deleting welcome audio for persona ${personaId}`);

        // Fetch persona with current audio URL
        const { data: persona, error: personaError } = await supabase
            .from('personas')
            .select('id, user_id, welcome_audio_url')
            .eq('id', personaId)
            .single();

        if (personaError || !persona) {
            console.error('[Audio Settings] Persona not found:', personaError);
            return NextResponse.json(
                { error: 'Persona not found' },
                { status: 404 }
            );
        }

        // Check ownership
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.is_admin || false;

        if (persona.user_id !== user.id && !isAdmin) {
            console.error(`[Audio Settings] Permission denied for user ${user.id}`);
            return NextResponse.json(
                { error: 'Permission denied' },
                { status: 403 }
            );
        }

        // Extract file path from URL if audio exists
        if (persona.welcome_audio_url) {
            try {
                // Parse the URL to get the file path
                const url = new URL(persona.welcome_audio_url);
                const pathMatch = url.pathname.match(/\/persona_audio\/(.+)$/);

                if (pathMatch && pathMatch[1]) {
                    const filePath = pathMatch[1];

                    // Delete from storage
                    const { error: deleteError } = await supabase.storage
                        .from('persona_audio')
                        .remove([filePath]);

                    if (deleteError) {
                        console.error('[Audio Settings] Storage deletion failed:', deleteError);
                        // Don't throw - continue to clear database reference
                    } else {
                        console.log(`[Audio Settings] Deleted file: ${filePath}`);
                    }
                }
            } catch (urlError) {
                console.error('[Audio Settings] Failed to parse audio URL:', urlError);
                // Continue to clear database reference
            }
        }

        // Clear welcome_audio_url in database
        const { error: updateError } = await supabase
            .from('personas')
            .update({
                welcome_audio_url: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', personaId);

        if (updateError) {
            console.error('[Audio Settings] Database update failed:', updateError);
            throw new AudioAPIError('Failed to remove audio reference', 500, 'UPDATE_FAILED');
        }

        console.log(`[Audio Settings] Successfully removed welcome audio for persona ${personaId}`);

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );

    } catch (error) {
        console.error('[Audio Settings] DELETE error:', error);

        if (error instanceof AudioAPIError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
