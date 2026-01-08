// cache.test.ts

import { jest } from '@jest/globals';

// Define the mock Supabase client methods
const mockSingle = jest.fn();
const mockUpsert = jest.fn().mockResolvedValue({ error: null });
const mockUpdate = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockLt = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();

const mockSupabase = {
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    lt: mockLt,
    in: mockIn,
    order: mockOrder,
    single: mockSingle,
    upsert: mockUpsert,
    update: mockUpdate,
    delete: mockDelete,
    storage: {
        from: jest.fn().mockReturnThis(),
        remove: jest.fn().mockResolvedValue({ error: null }),
    }
};

// Mock Supabase Server
jest.mock('@/lib/supabase/server', () => {
    return {
        __esModule: true,
        createClient: jest.fn(() => mockSupabase),
    };
});

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
    })),
}));

beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-key';
});

const { getAudioCache } = require('../../lib/audio/AudioCacheManager');

describe('AudioCacheManager', () => {
    let cache: any;

    beforeEach(() => {
        jest.clearAllMocks();
        cache = getAudioCache();

        // Reset and setup default chains
        mockFrom.mockReset().mockReturnThis();
        mockSelect.mockReset().mockReturnThis();
        mockEq.mockReset().mockReturnThis();
        mockLt.mockReset().mockReturnThis();
        mockIn.mockReset().mockReturnThis();
        mockOrder.mockReset().mockReturnThis();
        mockUpdate.mockReset().mockReturnThis();
        mockDelete.mockReset().mockReturnThis();
        mockUpsert.mockReset().mockResolvedValue({ error: null });
        mockSingle.mockReset().mockReturnThis();

        // Mock storage defaults
        (mockSupabase.storage.from as jest.Mock).mockReset().mockReturnThis();
        (mockSupabase.storage.remove as jest.Mock).mockReset().mockResolvedValue({ error: null });

        // Ensure createClient mock is active (resetAllMocks might clear it if it was a spy, but here it's checking usage)
    });

    test('Cache hit', async () => {
        mockSingle.mockResolvedValueOnce({
            data: { id: '1', audio_url: 'u', access_count: 0, last_accessed_at: new Date().toISOString(), created_at: new Date().toISOString() },
            error: null
        });
        mockUpdate.mockReturnValueOnce({ eq: jest.fn().mockResolvedValue({ error: null }) });
        const result = await cache.get('hash1');
        expect(result).not.toBeNull();
    });

    test('Cache miss', async () => {
        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'NotFound' } });
        const result = await cache.get('hash2');
        expect(result).toBeNull();
    });

    test('set stores audio with metadata', async () => {
        mockUpsert.mockResolvedValueOnce({ error: null });

        await cache.set('hash1', 'url1', {
            voiceId: 'v1',
            voiceProvider: 'p1',
            fileSize: 1000,
            duration: 10.5
        });

        expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
            text_hash: 'hash1',
            audio_url: 'url1',
            voice_id: 'v1',
            voice_provider: 'p1',
            file_size_bytes: 1000,
            duration_seconds: 10.5
        }), expect.any(Object));
    });

    test('Cache eviction (auto-cleanup)', async () => {
        // Mock getStats to show we're over limit
        mockSelect.mockResolvedValueOnce({
            data: new Array(11000).fill({ file_size_bytes: 100 }), // Over 10000 limit
            error: null
        });

        const cleanupSpy = jest.spyOn(cache, 'cleanup').mockResolvedValue({ deletedCount: 10, freedBytes: 1000, errors: [] });

        await (cache as any).autoCleanup();
        expect(cleanupSpy).toHaveBeenCalled();
    });

    test('Cache cleanup (manual)', async () => {
        // Mock finding old entries
        mockSelect.mockReturnValueOnce({
            lt: jest.fn().mockResolvedValueOnce({ data: [{ id: 'old1' }], error: null })
        });
        // Mock deleting
        mockDelete.mockReturnValueOnce({
            in: jest.fn().mockResolvedValueOnce({ error: null })
        });
        // Mock size check
        mockSelect.mockReturnValueOnce({
            data: [{ file_size_bytes: 100 }],
            error: null
        });

        const stats = await cache.cleanup(1, 1000);
        expect(stats.deletedCount).toBeGreaterThan(0);
    });

    test('Cache stats', async () => {
        mockSelect.mockResolvedValueOnce({
            data: [
                { id: '1', file_size_bytes: 100, access_count: 5, created_at: new Date().toISOString(), voice_id: 'v1' }
            ],
            error: null
        });
        const stats = await cache.getStats();
        expect(stats.totalEntries).toBe(1);
        expect(stats.hitRate).toBe(5);
    });
});
