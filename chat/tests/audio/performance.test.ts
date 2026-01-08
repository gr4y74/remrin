// performance.test.ts
import { performance } from 'perf_hooks';
import { EdgeTTSProvider } from '../../lib/audio/providers/EdgeTTSProvider';
import { getAudioCache } from '../../lib/audio/AudioCacheManager';
import { jest } from '@jest/globals';

// Mock fetch and WebSocket globally for performance tests
global.fetch = jest.fn() as any;
(global as any).WebSocket = class {
    onopen: any; onmessage: any; onerror: any; onclose: any;
    readyState = 1; binaryType = '';
    constructor() { setTimeout(() => this.onopen?.(), 1); }
    send(msg: string) {
        if (msg.includes('ssml')) {
            setTimeout(() => {
                const total = new Uint8Array([0, 0, 1, 2, 3]);
                this.onmessage?.({ data: total.buffer });
                this.onmessage?.({ data: 'Path:turn.end' });
            }, 1);
        }
    }
    close() { }
};

// Mock Supabase to keep it fast
jest.mock('../../lib/supabase/server', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }),
            upsert: () => Promise.resolve({ error: null }),
            update: () => ({ eq: () => Promise.resolve({ error: null }) }),
        })
    })
}));

describe('Performance Benchmarks', () => {
    const provider = new EdgeTTSProvider();
    const cache = getAudioCache();

    test('TTS generation time benchmark', async () => {
        // Warm up
        (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => [{ ShortName: 'v1', FriendlyName: 'v1', Locale: 'en-US', Gender: 'Female' }] });
        await provider.listVoices();

        const start = performance.now();
        await provider.generateSpeech('Performance test text', 'v1');
        const duration = performance.now() - start;
        console.log(`TTS generation duration: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(1000);
    });

    test('Cache lookup time benchmark', async () => {
        const start = performance.now();
        await cache.get('some-hash');
        const duration = performance.now() - start;
        console.log(`Cache lookup duration: ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(100);
    });
});
