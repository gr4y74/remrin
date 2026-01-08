/**
 * Audio Upload API Route
 * 
 * POST /api/audio/upload
 * Handles welcome audio file uploads for personas
 * 
 * Features:
 * - File type and size validation
 * - User permission verification
 * - Supabase storage upload to persona_audio bucket
 * - Database update with audio URL
 * - Comprehensive error handling
 */

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
    ALLOWED_AUDIO_TYPES,
    MAX_AUDIO_SIZE,
    AudioAPIError,
    type AudioUploadResponse,
} from '@/types/audio';

/**
 * POST: Upload welcome audio for a persona
 * 
 * Request Body (FormData):
 * - personaId: string (UUID)
 * - file: File (audio file)
 * 
 * Response:
 * - success: boolean
 * - audioUrl?: string
 * - error?: string
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Initialize Supabase client
        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[Audio Upload] Authentication failed:', authError);
            return NextResponse.json(
                { success: false, error: 'Unauthorized' } as AudioUploadResponse,
                { status: 401 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const personaId = formData.get('personaId') as string;
        const file = formData.get('file') as File;

        // Validate inputs
        if (!personaId || !file) {
            return NextResponse.json(
                { success: false, error: 'Missing personaId or file' } as AudioUploadResponse,
                { status: 400 }
            );
        }

        // Validate persona ID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(personaId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid persona ID format' } as AudioUploadResponse,
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_AUDIO_TYPES.includes(file.type as any)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid file type. Allowed types: ${ALLOWED_AUDIO_TYPES.join(', ')}`,
                } as AudioUploadResponse,
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_AUDIO_SIZE) {
            return NextResponse.json(
                {
                    success: false,
                    error: `File too large. Maximum size: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
                } as AudioUploadResponse,
                { status: 400 }
            );
        }

        console.log(`[Audio Upload] User ${user.id} uploading audio for persona ${personaId}`);
        console.log(`[Audio Upload] File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`);

        // Verify user owns or has permission to modify this persona
        const { data: persona, error: personaError } = await supabase
            .from('personas')
            .select('id, user_id, name')
            .eq('id', personaId)
            .single();

        if (personaError || !persona) {
            console.error('[Audio Upload] Persona not found:', personaError);
            return NextResponse.json(
                { success: false, error: 'Persona not found' } as AudioUploadResponse,
                { status: 404 }
            );
        }

        // Check ownership (allow if user owns the persona or is admin)
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.is_admin || false;

        if (persona.user_id !== user.id && !isAdmin) {
            console.error(`[Audio Upload] Permission denied: User ${user.id} does not own persona ${personaId}`);
            return NextResponse.json(
                { success: false, error: 'Permission denied' } as AudioUploadResponse,
                { status: 403 }
            );
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop() || 'mp3';
        const timestamp = Date.now();
        const filePath = `${personaId}/welcome_audio_${timestamp}.${fileExt}`;

        // Convert File to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('persona_audio')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('[Audio Upload] Storage upload failed:', uploadError);
            throw new AudioAPIError('Failed to upload audio file', 500, 'UPLOAD_FAILED');
        }

        console.log(`[Audio Upload] File uploaded successfully: ${uploadData.path}`);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('persona_audio')
            .getPublicUrl(filePath);

        const audioUrl = urlData.publicUrl;

        // Update persona record with new audio URL
        const { error: updateError } = await supabase
            .from('personas')
            .update({
                welcome_audio_url: audioUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', personaId);

        if (updateError) {
            console.error('[Audio Upload] Database update failed:', updateError);

            // Attempt to clean up uploaded file
            await supabase.storage.from('persona_audio').remove([filePath]);

            throw new AudioAPIError('Failed to update persona record', 500, 'UPDATE_FAILED');
        }

        const duration = Date.now() - startTime;
        console.log(`[Audio Upload] Success for persona ${personaId} in ${duration}ms`);

        return NextResponse.json(
            {
                success: true,
                audioUrl,
            } as AudioUploadResponse,
            { status: 200 }
        );

    } catch (error) {
        console.error('[Audio Upload] Unexpected error:', error);

        if (error instanceof AudioAPIError) {
            return NextResponse.json(
                { success: false, error: error.message } as AudioUploadResponse,
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error' } as AudioUploadResponse,
            { status: 500 }
        );
    }
}
