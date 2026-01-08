/**
 * @jest-environment node
 */

/**
 * Edge TTS Provider Integration Tests
 * 
 * Tests for the EdgeTTSProvider implementation including:
 * - Voice listing (Real Integration)
 * - Speech generation (Mocked due to CI/Environment 403 restrictions)
 * - Error handling
 */

import { EdgeTTSProvider, createEdgeTTSProvider } from '@/lib/audio/providers/EdgeTTSProvider';
import {
    InvalidVoiceError,
    InvalidTextError,
    AudioProviderError,
} from '@/lib/audio/providers/AudioProvider.interface';

// Shim WebSocket for Node environment to ensure the class exists
try {
    global.WebSocket = require('ws');
} catch (e) {
    console.warn('ws package not found');
}

// Mock WebSocket class for generating speech
class MockWebSocket {
    onopen: (() => void) | null = null;
    onmessage: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
    onclose: ((event: any) => void) | null = null;
    readyState = 1; // OPEN
    binaryType = 'blob';

    constructor(public url: string, public options?: any) {
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 10);
    }

    send(data: string | ArrayBuffer) {
        // Simulate response flow
        if (typeof data === 'string' && data.includes('Path:ssml')) {
            setTimeout(() => {
                if (this.onmessage) {
                    // 1. Send dummy audio data
                    // Format: 2 bytes header length (big endian), then header (skipped), then audio
                    const headerLen = 2;
                    const audioContent = new Uint8Array(100).fill(1).buffer;

                    // Create a buffer with header length 0 (minimal) to simplify
                    // The provider reads Uint16 at offset 0.
                    // Let's say header is 10 bytes?
                    const headerSize = 10;
                    const buffer = new ArrayBuffer(headerSize + 2 + 100);
                    const view = new DataView(buffer);
                    view.setUint16(0, headerSize, false); // Header length

                    this.onmessage({ data: buffer });

                    // 2. Send turn.end
                    this.onmessage({ data: "Path:turn.end" });
                }
            }, 50);
        }
    }

    close() {
        if (this.onclose) this.onclose({ code: 1000, reason: 'Normal closure' });
    }
}

describe('EdgeTTSProvider', () => {
    let provider: EdgeTTSProvider;
    let originalWebSocket: any;

    beforeAll(() => {
        provider = createEdgeTTSProvider({
            maxRetries: 1,
            initialDelayMs: 100,
        });
        originalWebSocket = global.WebSocket;
    });

    afterAll(() => {
        provider.clearCache();
        global.WebSocket = originalWebSocket;
    });

    describe('listVoices', () => {
        // These tests hit the real API to verify connectivity
        it('should return a list of voices', async () => {
            const voices = await provider.listVoices();

            expect(Array.isArray(voices)).toBe(true);
            expect(voices.length).toBeGreaterThan(0);
        });

        it('should filter voices by locale', async () => {
            const usVoices = await provider.listVoices('en-US');
            if (usVoices.length > 0) {
                expect(usVoices.every(v => v.locale.startsWith('en-US'))).toBe(true);
            }
        });

        it('should cache voice list', async () => {
            const startTime = Date.now();
            await provider.listVoices();

            const cachedStartTime = Date.now();
            await provider.listVoices();
            const cachedCallTime = Date.now() - cachedStartTime;

            expect(cachedCallTime).toBeLessThan(100);
        });
    });

    describe('getVoiceInfo', () => {
        it('should return detailed voice info for valid voice', async () => {
            const voices = await provider.listVoices();
            if (voices.length > 0) {
                const validId = voices[0].id;
                const voiceInfo = await provider.getVoiceInfo(validId);
                expect(voiceInfo).toHaveProperty('id', validId);
            }
        });

        it('should throw InvalidVoiceError for invalid voice', async () => {
            await expect(provider.getVoiceInfo('invalid-voice-id-xyz-123'))
                .rejects
                .toThrow(InvalidVoiceError);
        });
    });

    describe('generateSpeech', () => {
        beforeEach(() => {
            // Mock WebSocket for generation tests
            global.WebSocket = MockWebSocket as any;
        });

        afterEach(() => {
            // Restore real WebSocket
            global.WebSocket = originalWebSocket;
        });

        it('should generate audio from text (Mocked)', async () => {
            // We can use any ID since we mock the WS response
            const voiceId = 'en-US-AriaNeural';

            const result = await provider.generateSpeech(
                'Hello, this is a test.',
                voiceId,
                { format: 'mp3' }
            );

            expect(result).toHaveProperty('audio');
            expect(result.audio.byteLength).toBe(100); // Our mock size
            expect(result).toHaveProperty('format', 'mp3');
            expect(result).toHaveProperty('voiceId', voiceId);
        });

        it('should throw InvalidTextError for empty text', async () => {
            await expect(provider.generateSpeech('', 'en-US-AriaNeural'))
                .rejects
                .toThrow(InvalidTextError);
        });

        it('should include generation metadata', async () => {
            const text = 'Metadata test';
            const result = await provider.generateSpeech(text, 'en-US-AriaNeural');

            expect(result.metadata).toBeDefined();
            expect(result.metadata.characterCount).toBe(text.length);
            expect(result.metadata.generationTimeMs).toBeGreaterThan(0);
        });
    });
});
