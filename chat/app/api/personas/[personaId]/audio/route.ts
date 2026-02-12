import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DELETE /api/personas/[personaId]/audio
 * Removes a track from the persona's playlist
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { personaId: string } }
) {
    try {
        const personaId = params.personaId;
        const { trackId } = await request.json();

        if (!personaId || !trackId) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const cookieStore = await cookies();
        const supabase = createClient(cookieStore);

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch current tracks
        const { data: persona, error: fetchError } = await supabase
            .from('personas')
            .select('creator_id, audio_tracks, background_music_url, welcome_audio_url')
            .eq('id', personaId)
            .single();

        if (fetchError || !persona) {
            return NextResponse.json({ error: "Persona not found" }, { status: 404 });
        }

        // Check ownership
        if (persona.creator_id !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let tracks = Array.isArray(persona.audio_tracks) ? persona.audio_tracks : [];
        const trackToRemove = tracks.find((t: any) => t.id === trackId);

        if (!trackToRemove) {
            return NextResponse.json({ error: "Track not found in playlist" }, { status: 404 });
        }

        // Filter out the track
        const updatedTracks = tracks.filter((t: any) => t.id !== trackId);

        const updateData: any = {
            audio_tracks: updatedTracks
        };

        // If it was the active background music or welcome audio, we might want to clear those too
        // but for now let's just keep them until the user explicitly changes them, 
        // OR we can clear them if they match.
        if (persona.background_music_url === trackToRemove.url) {
            updateData.background_music_url = null;
        }
        if (persona.welcome_audio_url === trackToRemove.url) {
            updateData.welcome_audio_url = null;
        }

        const { error: updateError } = await supabase
            .from('personas')
            .update(updateData)
            .eq('id', personaId);

        if (updateError) throw updateError;

        // Note: We don't delete the physical file from storage here to prevent accidents 
        // if the same URL is used elsewhere, but ideally we would if it's unique.

        return NextResponse.json({ success: true, message: "Track removed" });

    } catch (error: any) {
        console.error("[Audio Delete] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
