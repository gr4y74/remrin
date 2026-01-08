/**
 * Audio Cache Warming Examples
 * Demonstrates how to preload common phrases for instant playback
 */

import { getAudioCache } from '@/lib/audio/AudioCacheManager';
import { createTextHash } from '@/lib/audio/utils/hash';

/**
 * Example 1: Warm cache with common welcome messages
 */
export async function warmWelcomeMessages() {
    const cache = getAudioCache();

    const welcomePhrases = [
        "Hello! Welcome to Remrin.",
        "How can I help you today?",
        "I'm here to assist you.",
        "What would you like to talk about?",
        "It's great to see you!",
    ];

    await cache.warmCache(
        welcomePhrases.map((text) => ({
            text,
            voiceId: "en-US-AriaNeural",
            voiceProvider: "edge",
            generateFn: async () => {
                // In production, this would call the actual TTS API
                const response = await fetch('/api/audio/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        voiceId: "en-US-AriaNeural",
                        provider: "edge",
                    }),
                });

                const data = await response.json();
                return {
                    url: data.audioUrl,
                    size: 8192, // Approximate
                    duration: data.duration,
                };
            },
        }))
    );

    console.log('✅ Welcome messages cached!');
}

/**
 * Example 2: Warm cache for specific persona
 */
export async function warmPersonaCache(personaId: string, voiceId: string) {
    const cache = getAudioCache();

    const commonResponses = [
        "That's interesting!",
        "Tell me more about that.",
        "I understand.",
        "That makes sense.",
        "I see what you mean.",
    ];

    await cache.warmCache(
        commonResponses.map((text) => ({
            text,
            voiceId,
            voiceProvider: "edge",
            generateFn: async () => {
                const response = await fetch('/api/audio/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        personaId,
                        voiceId,
                        provider: "edge",
                    }),
                });

                const data = await response.json();
                return {
                    url: data.audioUrl,
                    size: 8192,
                    duration: data.duration,
                };
            },
        }))
    );

    console.log(`✅ Persona ${personaId} cache warmed!`);
}

/**
 * Example 3: Warm cache with multiple voices
 */
export async function warmMultiVoiceCache() {
    const cache = getAudioCache();

    const voices = [
        { id: "en-US-AriaNeural", provider: "edge" },
        { id: "en-GB-SoniaNeural", provider: "edge" },
        { id: "en-AU-NatashaNeural", provider: "edge" },
    ];

    const phrase = "Welcome to Remrin!";

    const warmingTasks = voices.map((voice) => ({
        text: phrase,
        voiceId: voice.id,
        voiceProvider: voice.provider,
        generateFn: async () => {
            const response = await fetch('/api/audio/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: phrase,
                    voiceId: voice.id,
                    provider: voice.provider,
                }),
            });

            const data = await response.json();
            return {
                url: data.audioUrl,
                size: 8192,
                duration: data.duration,
            };
        },
    }));

    await cache.warmCache(warmingTasks);

    console.log(`✅ Cached "${phrase}" in ${voices.length} voices!`);
}

/**
 * Example 4: Scheduled cache warming (run on server startup)
 */
export async function scheduledCacheWarming() {
    console.log('🔥 Starting scheduled cache warming...');

    try {
        // Warm common phrases
        await warmWelcomeMessages();

        // Warm top personas (fetch from database)
        const topPersonas = await getTopPersonas(5);
        for (const persona of topPersonas) {
            if (persona.voice_id) {
                await warmPersonaCache(persona.id, persona.voice_id);
            }
        }

        console.log('✅ Scheduled cache warming complete!');
    } catch (error) {
        console.error('❌ Cache warming failed:', error);
    }
}

/**
 * Helper: Get top personas by usage
 */
async function getTopPersonas(limit: number): Promise<{ id: string; voice_id?: string }[]> {
    // This would query your database for most-used personas
    // Placeholder implementation
    return [];
}

/**
 * Example 5: Check if phrase is cached before generating
 */
export async function checkAndGenerate(
    text: string,
    voiceId: string,
    provider: string = "edge"
) {
    const cache = getAudioCache();
    const hash = createTextHash(text, voiceId, { provider });

    // Check cache first
    const cached = await cache.get(hash);
    if (cached) {
        console.log('✅ Cache hit!');
        return cached.audioUrl;
    }

    // Generate if not cached
    console.log('⚠️ Cache miss - generating...');
    const response = await fetch('/api/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId, provider }),
    });

    const data = await response.json();
    return data.audioUrl;
}

/**
 * Example 6: Batch cache warming with progress tracking
 */
export async function batchWarmCache(
    phrases: string[],
    voiceId: string,
    onProgress?: (current: number, total: number) => void
) {
    const cache = getAudioCache();
    let completed = 0;

    for (const text of phrases) {
        try {
            const hash = createTextHash(text, voiceId);
            const existing = await cache.get(hash);

            if (!existing) {
                // Generate and cache
                const response = await fetch('/api/audio/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, voiceId, provider: "edge" }),
                });

                await response.json();
            }

            completed++;
            onProgress?.(completed, phrases.length);
        } catch (error) {
            console.error(`Failed to warm cache for: "${text}"`, error);
        }
    }

    console.log(`✅ Batch warming complete: ${completed}/${phrases.length}`);
}

/**
 * Example 7: Smart cache warming based on analytics
 */
export async function smartCacheWarming() {
    const cache = getAudioCache();
    const stats = await cache.getStats();

    console.log('📊 Current cache stats:');
    console.log(`  - Total entries: ${stats.totalEntries}`);
    console.log(`  - Hit rate: ${stats.hitRate.toFixed(2)}`);
    console.log(`  - Top voice: ${stats.topVoices[0]?.voiceId}`);

    // Warm cache for top voices
    for (const voice of stats.topVoices.slice(0, 3)) {
        console.log(`🔥 Warming cache for popular voice: ${voice.voiceId}`);
        await warmPersonaCache('default-persona', voice.voiceId);
    }
}
