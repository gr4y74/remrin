// api-routes.test.ts
import { setupGlobalRequest } from '../test-utils';
setupGlobalRequest();

import { jest } from '@jest/globals';

// Route imports moved down


// Mock NextResponse
const NextResponse = require('next/server').NextResponse;
jest.spyOn(NextResponse, 'json').mockImplementation((data, init: any) => ({
    status: init?.status || 200,
    json: async () => data,
}));

// Mock Supabase
const mockSupabase = {
    auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user1' } }, error: null }),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    storage: {
        from: jest.fn().mockReturnThis(),
        remove: jest.fn().mockResolvedValue({ error: null }),
        upload: jest.fn().mockResolvedValue({ data: { path: 'path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://url.mp3' } }),
    }
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

// Route imports using require (after mocks)
const { GET: getVoices } = require('../../app/api/audio/voices/route');
const { POST: generateTTS } = require('../../app/api/audio/generate/route');
const { POST: uploadAudio } = require('../../app/api/audio/upload/route');
const { DELETE: deleteAudio } = require('../../app/api/audio/[personaId]/route');

function mockRequest({ method = 'GET', body = {}, query = {}, url = 'http://localhost' } = {}) {
    const fullUrl = new URL(url);
    Object.entries(query).forEach(([k, v]) => fullUrl.searchParams.set(k, v as string));

    return {
        method,
        url: fullUrl.toString(),
        json: async () => body,
        formData: async () => {
            const fd = new FormData();
            Object.entries(body).forEach(([k, v]) => fd.append(k, v as any));
            return fd;
        },
        headers: new Headers({ 'content-type': 'application/json' }),
    } as any;
}

describe('API Routes Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/audio/voices success', async () => {
        const req = mockRequest({ url: 'http://localhost/api/audio/voices' });
        const res = await getVoices(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
    });

    test('POST /api/audio/generate unauthorized if no auth', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        const req = mockRequest({ method: 'POST', body: { text: 'hi' } });
        const res = await generateTTS(req);
        expect(res.status).toBe(401);
    });

    test('DELETE /api/audio/[personaId] success', async () => {
        mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: 'u1' } }, error: null });
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'personas') {
                return {
                    select: () => ({ eq: () => ({ single: () => ({ data: { user_id: 'u1', welcome_audio_url: 'http://.../audio.mp3' }, error: null }) }) }),
                    update: () => ({ eq: () => ({ error: null }) }),
                };
            }
            return { select: () => ({ eq: () => ({ single: () => ({ data: { is_admin: false }, error: null }) }) }) };
        });

        const req = mockRequest({ method: 'DELETE' });
        const context = { params: Promise.resolve({ personaId: 'p1' }) };
        const res = await deleteAudio(req, context as any);
        expect(res.status).toBe(200);
    });

    test('POST /api/audio/upload success', async () => {
        const validPersonaId = '550e8400-e29b-41d4-a716-446655440000';

        // Mock successful upload
        const req = mockRequest({
            method: 'POST',
            url: 'http://localhost/api/audio/upload'
        });

        // Manual mock for formData
        req.formData = async () => ({
            get: (key: string) => {
                if (key === 'file') return {
                    size: 1000,
                    type: 'audio/mpeg',
                    name: 'test.mp3',
                    arrayBuffer: async () => new ArrayBuffer(8)
                };
                if (key === 'personaId') return validPersonaId;
                return null;
            }
        });

        // Mock the permission check
        mockSupabase.from.mockImplementation((table) => {
            if (table === 'personas') {
                return {
                    select: () => ({ eq: () => ({ single: () => ({ data: { user_id: 'user1' }, error: null }) }) }),
                    update: () => ({ eq: () => ({ error: null }) })
                } as any;
            }
            return mockSupabase;
        });
        // Ensure update call returns something valid (used in route to update welcome_audio_url)
        // Also ensure storage.upload returns success (already in default mock)

        const res = await uploadAudio(req);
        expect(res.status).toBe(200);
    });
});
