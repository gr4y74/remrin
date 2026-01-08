
import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { KokoroProvider } from '../../lib/audio/providers/KokoroProvider';
import { AudioProviderError } from '../../lib/audio/providers/AudioProvider.interface';

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('KokoroProvider', () => {
    let provider: KokoroProvider;

    beforeEach(() => {
        provider = new KokoroProvider();
        jest.clearAllMocks();
    });

    test('should have correct name and settings', () => {
        expect(provider.name).toBe('kokoro');
        expect(provider.requiresApiKey).toBe(false);
    });

    test('generateSpeech should call local API correctly', async () => {
        const mockArrayBuffer = new ArrayBuffer(10);
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(mockArrayBuffer),
        });

        const result = await provider.generateSpeech('Hello world', 'af');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/audio/speech'),
            expect.objectContaining({
                method: 'POST',
                body: expect.stringContaining('Hello world'),
            })
        );

        expect(result.audio).toBe(mockArrayBuffer);
        expect(result.metadata.provider).toBe('kokoro');
    });

    test('generateSpeech should handle API errors', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        });

        await expect(provider.generateSpeech('test', 'af'))
            .rejects
            .toThrow(AudioProviderError);
    });

    test('listVoices should return static list', async () => {
        const voices = await provider.listVoices();
        expect(voices.length).toBeGreaterThan(0);
        expect(voices[0].provider).toBe('kokoro');
        expect(voices[0].isNeural).toBe(true);
    });

    test('getStatus should check health endpoint', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
        });

        const status = await provider.getStatus();
        expect(status.available).toBe(true);
        expect(status.name).toBe('Kokoro Local');
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/health'));
    });
});
