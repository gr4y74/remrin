// generate-route.test.ts
import { TextEncoder, TextDecoder } from 'util';

Object.assign(global, { TextDecoder, TextEncoder });

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

if (typeof global.Headers === 'undefined') {
    // @ts-ignore
    global.Headers = class Headers {
        private map = new Map<string, string>();
        constructor(init?: any) {
            if (init) {
                if (init instanceof Headers) {
                    init.forEach((v, k) => this.map.set(k, v));
                } else if (Array.isArray(init)) {
                    init.forEach(([k, v]) => this.map.set(k, v));
                } else {
                    Object.entries(init).forEach(([k, v]) => this.map.set(k, v as string));
                }
            }
        }
        append(key: string, value: string) { this.map.set(key, value); }
        delete(key: string) { this.map.delete(key); }
        get(key: string) { return this.map.get(key) || null; }
        has(key: string) { return this.map.has(key); }
        set(key: string, value: string) { this.map.set(key, value); }
        forEach(callback: any) { this.map.forEach(callback); }
    } as any;
}

if (typeof global.Response === 'undefined') {
    // @ts-ignore
    global.Response = class Response {
        status: number;
        ok: boolean;
        headers: Headers;
        constructor(body?: BodyInit | null, init?: ResponseInit) {
            this.status = init?.status || 200;
            this.ok = this.status >= 200 && this.status < 300;
            this.headers = new Headers(init?.headers);
        }
    } as any;
}


import { jest } from '@jest/globals';
import { AudioCacheManager } from '../../lib/audio/AudioCacheManager';

// Mocks must be defined before imports/requires
// Mock AudioCacheManager
const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    cleanup: jest.fn(),
    getStats: jest.fn(),
};

jest.mock('../../lib/audio/AudioCacheManager', () => ({
    getAudioCache: jest.fn(() => mockCache),
    AudioCacheManager: jest.fn(() => mockCache),
}));

// Mock Supabase
const mockSupabase = {
    auth: {
        getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://generated.mp3' } }),
    },
};

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(() => mockSupabase),
}));

jest.mock('next/headers', () => ({
    cookies: jest.fn().mockResolvedValue({}),
}));

// Mock NextResponse
const NextResponse = require('next/server').NextResponse;
jest.spyOn(NextResponse, 'json').mockImplementation((data: any, init: any) => ({
    status: init?.status || 200,
    json: async () => data,
}));

// Import route using require
const { POST: generateTTS } = require('../../app/api/audio/generate/route');

// Helper for requests
function mockRequest(body = {}) {
    return {
        json: jest.fn().mockResolvedValue(body),
        headers: { get: () => 'application/json' },
    };
}

describe('TTS Generate API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default auth success
        mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user123' } }, error: null });
    });

    it('should return cached audio if available', async () => {
        // Setup cache hit
        mockCache.get.mockResolvedValueOnce({
            audioUrl: 'https://cached-url.mp3',
            duration: 5.0,
            fileSize: 100,
            hitCount: 1,
            lastAccessed: new Date(),
            createdAt: new Date(),
        });

        // Setup persona lookup
        mockSupabase.single.mockResolvedValueOnce({
            data: { voice_provider: 'edge', voice_id: 'test-voice', voice_settings: {} },
            error: null
        });

        const validPersonaId = '550e8400-e29b-41d4-a716-446655440000';
        const req = mockRequest({ text: 'Hello', personaId: validPersonaId });
        const res = await generateTTS(req as any);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.cached).toBe(true);
        expect(data.audioUrl).toBe('https://cached-url.mp3');
        expect(mockCache.get).toHaveBeenCalled();
        expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should generate and cache audio if cache miss', async () => {
        // Setup cache miss
        mockCache.get.mockResolvedValueOnce(null);

        // Setup persona lookup
        mockSupabase.single.mockResolvedValueOnce({
            data: { voice_provider: 'edge', voice_id: 'test-voice', voice_settings: {} },
            error: null
        });

        const validPersonaId = '550e8400-e29b-41d4-a716-446655440000';
        const req = mockRequest({ text: 'Hello', personaId: validPersonaId });
        const res = await generateTTS(req as any);
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data.cached).toBe(false);
        // Note: The actual audio URL will come from the internal implementation details of generateTTS mock/stub
        // Since we didn't mock generateTTS internal function, it uses the "mock" implementation inside the route
        // which returns a URL containing "generated/tts_edge_..."
        expect(data.audioUrl).toBe('https://generated.mp3');

        expect(mockCache.set).toHaveBeenCalled();
    });

    it('should handle unauthorized requests', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: 'Auth error' });

        const validPersonaId = '550e8400-e29b-41d4-a716-446655440000';
        const req = mockRequest({ text: 'Hello', personaId: validPersonaId });
        const res = await generateTTS(req as any);

        expect(res.status).toBe(401);
    });

    it('should validate request body', async () => {
        const req = mockRequest({}); // Missing text/personaId
        const res = await generateTTS(req as any);

        expect(res.status).toBe(400);
    });
});
