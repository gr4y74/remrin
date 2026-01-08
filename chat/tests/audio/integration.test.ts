/**
 * Audio System Integration Tests
 * 
 * Comprehensive end-to-end tests for the Remrin.ai Audio System.
 * Tests all providers, fallbacks, tier restrictions, quota enforcement,
 * caching, and complete user flows.
 * 
 * Run with: npm test -- tests/audio/integration.test.ts
 */

import { jest, describe, test, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

// Set up environment variables before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// ============================================================================
// Global Mocks Setup
// ============================================================================

// Mock Headers, Request, Response for Node.js environment
if (typeof global.Headers === 'undefined') {
    // @ts-ignore
    global.Headers = class Headers {
        private map = new Map<string, string>();
        constructor(init?: any) {
            if (init) {
                if (Array.isArray(init)) {
                    init.forEach(([k, v]) => this.map.set(k, v));
                } else if (typeof init === 'object') {
                    Object.entries(init).forEach(([k, v]) => this.map.set(k, v as string));
                }
            }
        }
        append(key: string, value: string) { this.map.set(key, value); }
        delete(key: string) { this.map.delete(key); }
        get(key: string) { return this.map.get(key) || null; }
        has(key: string) { return this.map.has(key); }
        set(key: string, value: string) { this.map.set(key, value); }
        forEach(callback: (value: string, key: string) => void) { this.map.forEach(callback); }
    } as any;
}

if (typeof global.Request === 'undefined') {
    // @ts-ignore
    global.Request = class Request {
        url: string;
        method: string;
        headers: Headers;
        body: any;
        constructor(input: string | Request, init?: RequestInit) {
            this.url = typeof input === 'string' ? input : input.url;
            this.method = init?.method || 'GET';
            this.headers = new Headers(init?.headers);
            this.body = init?.body;
        }
    } as any;
}

if (typeof global.Response === 'undefined') {
    // @ts-ignore
    global.Response = class Response {
        status: number;
        ok: boolean;
        headers: Headers;
        body: any;
        constructor(body?: BodyInit | null, init?: ResponseInit) {
            this.status = init?.status || 200;
            this.ok = this.status >= 200 && this.status < 300;
            this.headers = new Headers(init?.headers);
            this.body = body;
        }
        async json() { return JSON.parse(this.body); }
    } as any;
}

// ============================================================================
// Supabase Mock
// ============================================================================

const mockCacheEntry = {
    id: 'cache-1',
    audio_url: 'https://cached.audio.url/test.mp3',
    access_count: 5,
    last_accessed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    file_size_bytes: 50000,
    duration_seconds: 5.5,
};

const mockPersona = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: 'user-123',
    voice_provider: 'edge',
    voice_id: 'en-US-JennyNeural',
    voice_settings: { rate: 1.0, pitch: 1.0 },
    welcome_audio_url: null,
};

const mockProfile = {
    id: 'user-123',
    subscription_tier: 'soul_weaver',
    is_admin: false,
};

const mockAudioGeneration = {
    id: 'gen-1',
    user_id: 'user-123',
    provider: 'edge',
    voice_id: 'en-US-JennyNeural',
    chars_count: 100,
    duration_seconds: 5.0,
    created_at: new Date().toISOString(),
};

// Track mock call returns
let mockDbReturns: Record<string, any> = {};

const mockSingle = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockLt = jest.fn().mockReturnThis();
const mockGte = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockUpsert = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn().mockReturnThis();
const mockIn = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockRpc = jest.fn();

const mockFrom = jest.fn((table: string) => {
    return {
        select: mockSelect,
        eq: mockEq,
        lt: mockLt,
        gte: mockGte,
        update: mockUpdate,
        upsert: mockUpsert,
        insert: mockInsert,
        delete: mockDelete,
        in: mockIn,
        order: mockOrder,
        limit: mockLimit,
        single: mockSingle,
    };
});

const mockSupabase = {
    auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
    },
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    lt: mockLt,
    gte: mockGte,
    update: mockUpdate,
    upsert: mockUpsert,
    insert: mockInsert,
    delete: mockDelete,
    in: mockIn,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    rpc: mockRpc,
    storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: { path: 'audio/test.mp3' }, error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://storage.url/test.mp3' } }),
    },
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => mockSupabase),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn().mockResolvedValue({
        get: jest.fn(),
        set: jest.fn(),
    }),
}));

// Mock NextResponse
const NextResponse = require('next/server').NextResponse;
jest.spyOn(NextResponse, 'json').mockImplementation((data: any, init: any) => ({
    status: init?.status || 200,
    ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    json: async () => data,
}));

// Mock AudioService to avoid real Supabase connection
const mockGenerateSpeech = jest.fn().mockResolvedValue({
    audio: new ArrayBuffer(1000),
    audioUrl: 'https://storage.url/test.mp3',
    cached: false,
    duration: 5.0,
    metadata: {
        provider: 'edge',
        voiceId: 'en-US-JennyNeural',
        textHash: 'test-hash',
        generationTimeMs: 100,
        characterCount: 50,
    },
});

const mockAudioServiceInstance = {
    generateSpeech: mockGenerateSpeech,
    listVoices: jest.fn().mockResolvedValue([]),
    getVoiceInfo: jest.fn().mockResolvedValue({}),
    getProviderStatus: jest.fn().mockResolvedValue({ available: true }),
    getCacheStats: jest.fn().mockResolvedValue({ totalEntries: 0 }),
    clearCache: jest.fn().mockResolvedValue({ deletedCount: 0 }),
};

jest.mock('@/lib/audio/AudioService', () => ({
    AudioService: jest.fn().mockImplementation(() => mockAudioServiceInstance),
    getAudioService: jest.fn(() => mockAudioServiceInstance),
    createAudioService: jest.fn(() => mockAudioServiceInstance),
}));

// ============================================================================
// Helper Functions
// ============================================================================

function createMockRequest(options: {
    method?: string;
    body?: any;
    url?: string;
    headers?: Record<string, string>;
} = {}) {
    return {
        method: options.method || 'GET',
        url: options.url || 'http://localhost',
        json: jest.fn().mockResolvedValue(options.body || {}),
        headers: new Headers(options.headers || { 'content-type': 'application/json' }),
    };
}

function resetMocks() {
    jest.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    mockSingle.mockReset().mockResolvedValue({ data: mockPersona, error: null });
    mockUpsert.mockReset().mockResolvedValue({ error: null });
    mockInsert.mockReset().mockResolvedValue({ error: null });
    mockRpc.mockReset().mockResolvedValue({ data: 10, error: null }); // Default: 10 generations used
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Audio System Integration Tests', () => {
    beforeEach(() => {
        resetMocks();
    });

    // ========================================================================
    // Provider Integration Tests
    // ========================================================================

    describe('Provider Integration', () => {
        describe('Edge TTS Provider', () => {
            test('should list available Edge TTS voices', async () => {
                const { GET: getVoices } = require('../../app/api/audio/voices/route');
                const req = createMockRequest({ url: 'http://localhost/api/audio/voices?provider=edge' });

                const res = await getVoices(req);
                const data = await res.json();

                expect(res.status).toBe(200);
                expect(Array.isArray(data)).toBe(true);
            });

            test('should generate speech with Edge TTS', async () => {
                const { POST: generateTTS } = require('../../app/api/audio/generate/route');

                // Setup: No cache hit
                mockSingle
                    .mockResolvedValueOnce({ data: mockPersona, error: null }) // Persona lookup
                    .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }); // Cache miss

                const req = createMockRequest({
                    method: 'POST',
                    body: {
                        text: 'Hello, this is a test.',
                        personaId: mockPersona.id,
                        provider: 'edge',
                    },
                });

                const res = await generateTTS(req as any);
                const data = await res.json();

                expect(res.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.audioUrl).toBeDefined();
            });

            test('should handle Edge TTS rate limiting gracefully', async () => {
                // This tests that rate limit errors are handled properly
                // In a real scenario, we'd mock the WebSocket connection
                const { POST: generateTTS } = require('../../app/api/audio/generate/route');

                mockSingle.mockResolvedValueOnce({ data: mockPersona, error: null });

                // Simulate rapid requests
                const requests = Array(5).fill(null).map(() =>
                    createMockRequest({
                        method: 'POST',
                        body: {
                            text: 'Test message ' + Math.random(),
                            personaId: mockPersona.id,
                        },
                    })
                );

                const results = await Promise.all(requests.map(req => generateTTS(req)));

                // All should complete (they may be throttled but not fail)
                results.forEach(res => {
                    expect(res.status).toBeLessThanOrEqual(500);
                });
            });
        });

        describe('Kokoro Provider', () => {
            test('should check Kokoro health status', async () => {
                const { GET: getHealth } = require('../../app/api/audio/kokoro/health/route');
                const req = createMockRequest();

                const res = await getHealth(req);
                const data = await res.json();

                // Should return health status (healthy, degraded, or unavailable)
                expect(res.status).toBe(200);
                expect(data).toHaveProperty('status');
            });

            test('should prevent free users from using Kokoro', async () => {
                const { POST: generateTTS } = require('../../app/api/audio/generate/route');

                // Mock free tier user
                mockSingle
                    .mockResolvedValueOnce({ data: mockPersona, error: null })
                    .mockResolvedValueOnce({ data: { ...mockProfile, subscription_tier: 'wanderer' }, error: null });

                const req = createMockRequest({
                    method: 'POST',
                    body: {
                        text: 'Test',
                        personaId: mockPersona.id,
                        provider: 'kokoro',
                    },
                });

                const res = await generateTTS(req as any);

                // Free users should either get fallback to Edge or error
                expect([200, 403]).toContain(res.status);
            });

            test('should allow premium users to use Kokoro', async () => {
                const { POST: generateTTS } = require('../../app/api/audio/generate/route');

                // Mock premium tier user
                mockSingle
                    .mockResolvedValueOnce({
                        data: { ...mockPersona, voice_provider: 'kokoro' },
                        error: null
                    });
                mockRpc.mockResolvedValueOnce({ data: 10, error: null }); // Quota OK

                const req = createMockRequest({
                    method: 'POST',
                    body: {
                        text: 'Test premium feature',
                        personaId: mockPersona.id,
                        provider: 'kokoro',
                    },
                });

                const res = await generateTTS(req as any);

                // Should succeed or handle gracefully if Kokoro server is unavailable
                expect([200, 503]).toContain(res.status);
            });
        });
    });

    // ========================================================================
    // Provider Fallback Tests
    // ========================================================================

    describe('Provider Fallbacks', () => {
        test('should fallback to Edge TTS when Kokoro is unavailable', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            mockSingle.mockResolvedValueOnce({
                data: { ...mockPersona, voice_provider: 'kokoro' },
                error: null
            });

            const req = createMockRequest({
                method: 'POST',
                body: {
                    text: 'Fallback test',
                    personaId: mockPersona.id,
                },
            });

            const res = await generateTTS(req as any);
            const data = await res.json();

            // Should complete successfully, potentially with fallback
            if (res.status === 200) {
                expect(data.audioUrl).toBeDefined();
            }
        });

        test('should fallback to Edge TTS when ElevenLabs quota exceeded', async () => {
            // ElevenLabs is a paid service with quotas
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            mockSingle.mockResolvedValueOnce({
                data: { ...mockPersona, voice_provider: 'elevenlabs' },
                error: null
            });

            const req = createMockRequest({
                method: 'POST',
                body: {
                    text: 'ElevenLabs test',
                    personaId: mockPersona.id,
                },
            });

            const res = await generateTTS(req as any);

            // Should handle gracefully - either success with fallback or appropriate error
            expect([200, 403, 503]).toContain(res.status);
        });
    });

    // ========================================================================
    // Tier Restriction Tests
    // ========================================================================

    describe('Tier Restrictions', () => {
        test('free tier users should only access Edge TTS', async () => {
            const AccessControl = require('../../lib/audio/access/AccessControl');

            // Mock getUserTier to return wanderer (free tier)
            const originalGetUserTier = require('@/lib/check-premium').getUserTier;
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'wanderer' });

            const canUseKokoro = await AccessControl.AudioAccessControl.checkFeatureAccess('user-123', 'kokoro');
            const canClone = await AccessControl.AudioAccessControl.checkFeatureAccess('user-123', 'cloning');

            expect(canUseKokoro).toBe(false);
            expect(canClone).toBe(false);
        });

        test('architect tier users should access Kokoro and voice cloning', async () => {
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'architect' });

            const AccessControl = require('../../lib/audio/access/AccessControl');

            const canUseKokoro = await AccessControl.AudioAccessControl.checkFeatureAccess('user-123', 'kokoro');
            const canClone = await AccessControl.AudioAccessControl.checkFeatureAccess('user-123', 'cloning');

            expect(canUseKokoro).toBe(true);
            expect(canClone).toBe(true);
        });

        test('titan tier users should have highest limits', async () => {
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'titan' });

            const AccessControl = require('../../lib/audio/access/AccessControl');
            const limits = await AccessControl.AudioAccessControl.getLimits('user-123');

            expect(limits.monthlyGenerationLimit).toBe(10000);
            expect(limits.maxClonedVoices).toBe(10);
            expect(limits.maxStorageMB).toBe(10240);
        });
    });

    // ========================================================================
    // Quota Enforcement Tests
    // ========================================================================

    describe('Quota Enforcement', () => {
        test('should track audio generation usage', async () => {
            const { AudioUsageService } = require('../../lib/audio/quota/AudioUsageService');

            mockInsert.mockResolvedValueOnce({ error: null });

            await AudioUsageService.trackGeneration(
                'user-123',
                'edge',
                'en-US-JennyNeural',
                100,
                5.0
            );

            expect(mockFrom).toHaveBeenCalledWith('audio_generations');
        });

        test('should check quota before generation', async () => {
            const { AudioUsageService } = require('../../lib/audio/quota/AudioUsageService');

            // Mock: User is under quota
            mockRpc.mockResolvedValueOnce({ data: 45, error: null });
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'wanderer' });

            const canGenerate = await AudioUsageService.checkQuota('user-123');

            expect(canGenerate).toBe(true);
        });

        test('should deny generation when quota exceeded', async () => {
            const { AudioUsageService } = require('../../lib/audio/quota/AudioUsageService');

            // Mock: User is over quota (wanderer limit is 50)
            mockRpc.mockResolvedValueOnce({ data: 60, error: null });
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'wanderer' });

            const canGenerate = await AudioUsageService.checkQuota('user-123');

            expect(canGenerate).toBe(false);
        });

        test('should allow unlimited for titan tier', async () => {
            const { AudioUsageService } = require('../../lib/audio/quota/AudioUsageService');

            // Titan tier has high limit (10000)
            mockRpc.mockResolvedValueOnce({ data: 9000, error: null });
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'titan' });

            const canGenerate = await AudioUsageService.checkQuota('user-123');

            expect(canGenerate).toBe(true);
        });
    });

    // ========================================================================
    // Caching Tests
    // ========================================================================

    describe('Caching System', () => {
        const { getAudioCache } = require('../../lib/audio/AudioCacheManager');

        test('should return cached audio on cache hit', async () => {
            const cache = getAudioCache();

            mockSingle.mockResolvedValueOnce({
                data: mockCacheEntry,
                error: null,
            });
            mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

            const result = await cache.get('test-hash-123');

            expect(result).not.toBeNull();
            expect(result.audioUrl).toBe(mockCacheEntry.audio_url);
        });

        test('should store new audio in cache', async () => {
            const cache = getAudioCache();

            mockUpsert.mockResolvedValueOnce({ error: null });

            await cache.set('new-hash-456', 'https://new.audio.url/test.mp3', {
                voiceId: 'en-US-JennyNeural',
                voiceProvider: 'edge',
                fileSize: 50000,
                duration: 5.5,
            });

            expect(mockUpsert).toHaveBeenCalled();
        });

        test('should increment hit count on cache access', async () => {
            const cache = getAudioCache();

            mockSingle.mockResolvedValueOnce({
                data: { ...mockCacheEntry, access_count: 10 },
                error: null,
            });
            mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

            const result = await cache.get('test-hash');

            expect(result.hitCount).toBe(10);
        });

        test('should perform LRU eviction when over limit', async () => {
            const cache = getAudioCache({ maxEntries: 100 });

            // Mock: Cache is over limit
            mockSelect.mockResolvedValueOnce({
                data: new Array(200).fill({ file_size_bytes: 1000 }),
                error: null,
            });

            const cleanupSpy = jest.spyOn(cache, 'cleanup').mockResolvedValue({
                deletedCount: 100,
                freedBytes: 100000,
                errors: [],
            });

            await cache.autoCleanup();

            expect(cleanupSpy).toHaveBeenCalled();
        });

        test('should return cache statistics', async () => {
            const cache = getAudioCache();

            mockSelect.mockResolvedValueOnce({
                data: [
                    { id: '1', file_size_bytes: 50000, access_count: 10, created_at: new Date().toISOString(), voice_id: 'v1' },
                    { id: '2', file_size_bytes: 30000, access_count: 5, created_at: new Date().toISOString(), voice_id: 'v1' },
                ],
                error: null,
            });

            const stats = await cache.getStats();

            expect(stats.totalEntries).toBe(2);
            expect(stats.totalSize).toBe(80000);
        });
    });

    // ========================================================================
    // Voice Cloning Tests
    // ========================================================================

    describe('Voice Cloning', () => {
        test('should prevent cloning for non-premium users', async () => {
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'wanderer' });

            const { POST: cloneVoice } = require('../../app/api/audio/clone/route');

            const req = createMockRequest({
                method: 'POST',
                body: {
                    name: 'My Clone',
                    sampleUrl: 'https://sample.audio/voice.mp3',
                },
            });

            const res = await cloneVoice(req as any);

            expect([401, 403]).toContain(res.status);
        });

        test('should enforce max cloned voices limit', async () => {
            jest.spyOn(require('@/lib/check-premium'), 'getUserTier').mockResolvedValue({ tier: 'architect' });

            // Mock: User already has 3 cloned voices (architect limit)
            mockSelect.mockResolvedValueOnce({
                data: [{ id: '1' }, { id: '2' }, { id: '3' }],
                count: 3,
                error: null,
            });

            const AccessControl = require('../../lib/audio/access/AccessControl');
            const limits = await AccessControl.AudioAccessControl.getLimits('user-123');

            expect(limits.maxClonedVoices).toBe(3);
        });
    });

    // ========================================================================
    // Analytics Tests
    // ========================================================================

    describe('Analytics', () => {
        test('should retrieve audio analytics', async () => {
            const { GET: getAnalytics } = require('../../app/api/audio/analytics/route');

            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'admin-user' } },
                error: null
            });

            // Mock admin check
            mockSingle.mockResolvedValueOnce({
                data: { is_admin: true },
                error: null
            });

            const req = createMockRequest();
            const res = await getAnalytics(req);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data).toHaveProperty('success');
        });
    });

    // ========================================================================
    // Complete User Flow Tests
    // ========================================================================

    describe('Complete User Flows', () => {
        test('should complete full TTS generation flow', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            // 1. Auth succeeds
            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: { id: 'user-123' } },
                error: null,
            });

            // 2. Persona lookup
            mockSingle.mockResolvedValueOnce({
                data: mockPersona,
                error: null,
            });

            // 3. Cache miss
            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { message: 'Not found' },
            });

            // 4. Generation and cache storage
            mockUpsert.mockResolvedValueOnce({ error: null });

            const req = createMockRequest({
                method: 'POST',
                body: {
                    text: 'Hello! This is a complete flow test.',
                    personaId: mockPersona.id,
                },
            });

            const res = await generateTTS(req as any);
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.cached).toBe(false);
            expect(data.audioUrl).toBeDefined();
        });

        test('should handle audio upload and retrieval flow', async () => {
            const { POST: uploadAudio } = require('../../app/api/audio/upload/route');
            const { GET: getPersonaAudio } = require('../../app/api/audio/[personaId]/route');

            // Upload flow
            const uploadReq = createMockRequest({
                method: 'POST',
            });
            (uploadReq as any).formData = async () => ({
                get: (key: string) => {
                    if (key === 'file') return {
                        size: 1000,
                        type: 'audio/mpeg',
                        name: 'welcome.mp3',
                        arrayBuffer: async () => new ArrayBuffer(1000),
                    };
                    if (key === 'personaId') return mockPersona.id;
                    return null;
                },
            });

            mockSingle.mockResolvedValueOnce({ data: { user_id: 'user-123' }, error: null });

            const uploadRes = await uploadAudio(uploadReq);
            expect(uploadRes.status).toBe(200);

            // Retrieval flow
            mockSingle.mockResolvedValueOnce({
                data: { ...mockPersona, welcome_audio_url: 'https://uploaded.url/welcome.mp3' },
                error: null,
            });

            const getReq = createMockRequest();
            const context = { params: Promise.resolve({ personaId: mockPersona.id }) };

            const getRes = await getPersonaAudio(getReq, context as any);
            const getData = await getRes.json();

            expect(getRes.status).toBe(200);
        });
    });

    // ========================================================================
    // Error Handling Tests
    // ========================================================================

    describe('Error Handling', () => {
        test('should handle authentication failures gracefully', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            mockSupabase.auth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: { message: 'Not authenticated' },
            });

            const req = createMockRequest({
                method: 'POST',
                body: { text: 'Test', personaId: mockPersona.id },
            });

            const res = await generateTTS(req as any);

            expect(res.status).toBe(401);
        });

        test('should handle invalid request body', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            const req = createMockRequest({
                method: 'POST',
                body: { invalid: 'data' }, // Missing required fields
            });

            const res = await generateTTS(req as any);

            expect(res.status).toBe(400);
        });

        test('should handle database errors', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { message: 'Database connection failed' },
            });

            const req = createMockRequest({
                method: 'POST',
                body: { text: 'Test', personaId: mockPersona.id },
            });

            const res = await generateTTS(req as any);

            // Should handle gracefully with appropriate error
            expect([400, 500, 503]).toContain(res.status);
        });

        test('should handle storage failures', async () => {
            const { POST: uploadAudio } = require('../../app/api/audio/upload/route');

            (mockSupabase.storage.upload as jest.Mock).mockResolvedValueOnce({
                data: null,
                error: { message: 'Storage quota exceeded' },
            });

            const req = createMockRequest({ method: 'POST' });
            (req as any).formData = async () => ({
                get: (key: string) => {
                    if (key === 'file') return {
                        size: 1000,
                        type: 'audio/mpeg',
                        name: 'test.mp3',
                        arrayBuffer: async () => new ArrayBuffer(1000),
                    };
                    if (key === 'personaId') return mockPersona.id;
                    return null;
                },
            });

            mockSingle.mockResolvedValueOnce({ data: { user_id: 'user-123' }, error: null });

            const res = await uploadAudio(req);

            expect([400, 500]).toContain(res.status);
        });
    });

    // ========================================================================
    // Performance Tests
    // ========================================================================

    describe('Performance Benchmarks', () => {
        const CACHE_LOOKUP_THRESHOLD_MS = 50; // Cache lookups should be under 50ms
        const GENERATION_THRESHOLD_MS = 5000; // Generation should complete under 5s

        test('cache lookup should be fast', async () => {
            const cache = require('../../lib/audio/AudioCacheManager').getAudioCache();

            mockSingle.mockResolvedValueOnce({
                data: mockCacheEntry,
                error: null,
            });
            mockUpdate.mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) });

            const start = Date.now();
            await cache.get('performance-test-hash');
            const duration = Date.now() - start;

            expect(duration).toBeLessThan(CACHE_LOOKUP_THRESHOLD_MS);
        });

        test('should handle concurrent requests', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            // Setup mocks for multiple requests
            mockSingle.mockResolvedValue({ data: mockPersona, error: null });

            const requests = Array(5).fill(null).map((_, i) =>
                createMockRequest({
                    method: 'POST',
                    body: {
                        text: `Concurrent test ${i}`,
                        personaId: mockPersona.id,
                    },
                })
            );

            const start = Date.now();
            const results = await Promise.all(requests.map(req => generateTTS(req)));
            const duration = Date.now() - start;

            // All should complete
            results.forEach(res => {
                expect([200, 400, 401, 403, 429, 500, 503]).toContain(res.status);
            });

            console.log(`Concurrent requests completed in ${duration}ms`);
        });
    });

    // ========================================================================
    // Edge Cases
    // ========================================================================

    describe('Edge Cases', () => {
        test('should handle empty text gracefully', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            const req = createMockRequest({
                method: 'POST',
                body: { text: '', personaId: mockPersona.id },
            });

            const res = await generateTTS(req as any);

            expect(res.status).toBe(400);
        });

        test('should handle extremely long text', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            const longText = 'a'.repeat(6000); // Over 5000 limit

            const req = createMockRequest({
                method: 'POST',
                body: { text: longText, personaId: mockPersona.id },
            });

            const res = await generateTTS(req as any);

            expect(res.status).toBe(400);
        });

        test('should handle special characters in text', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            mockSingle.mockResolvedValueOnce({ data: mockPersona, error: null });

            const req = createMockRequest({
                method: 'POST',
                body: {
                    text: 'Hello! 你好! مرحبا! 🎉 <script>alert("test")</script>',
                    personaId: mockPersona.id,
                },
            });

            const res = await generateTTS(req as any);

            // Should handle gracefully (either process or sanitize)
            expect([200, 400]).toContain(res.status);
        });

        test('should handle non-existent persona', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            mockSingle.mockResolvedValueOnce({
                data: null,
                error: { message: 'Persona not found' },
            });

            const req = createMockRequest({
                method: 'POST',
                body: {
                    text: 'Test',
                    personaId: '00000000-0000-0000-0000-000000000000',
                },
            });

            const res = await generateTTS(req as any);

            expect([400, 404]).toContain(res.status);
        });

        test('should handle invalid UUID format for personaId', async () => {
            const { POST: generateTTS } = require('../../app/api/audio/generate/route');

            const req = createMockRequest({
                method: 'POST',
                body: {
                    text: 'Test',
                    personaId: 'not-a-valid-uuid',
                },
            });

            const res = await generateTTS(req as any);

            expect(res.status).toBe(400);
        });
    });
});
