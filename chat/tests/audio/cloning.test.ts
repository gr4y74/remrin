
import { describe, expect, test, beforeEach } from '@jest/globals';
import { VoiceCloningService } from '../../lib/audio/cloning/VoiceCloningService';

describe('VoiceCloningService', () => {
    let service: VoiceCloningService;

    beforeEach(() => {
        service = new VoiceCloningService();
    });

    test('startCloning should create a pending job', async () => {
        // Mock File object since it's not available in Node environment by default
        const mockFile = { name: 'sample.wav', size: 1024 } as unknown as File;

        const request = {
            name: 'Test Voice',
            sampleFiles: [mockFile],
        };

        const job = await service.startCloning(request);

        expect(job.jobId).toBeDefined();
        expect(job.status).toBe('pending');
        expect(job.progress).toBe(0);
    });

    test('getJobStatus should return job details', async () => {
        const mockFile = { name: 'sample.wav', size: 1024 } as unknown as File;

        const request = {
            name: 'Test Voice',
            sampleFiles: [mockFile],
        };

        const job = await service.startCloning(request);
        const status = await service.getJobStatus(job.jobId);

        expect(status).toBeDefined();
        expect(status?.jobId).toBe(job.jobId);
    });

    test('getJobStatus should return null for invalid ID', async () => {
        const status = await service.getJobStatus('invalid_id');
        expect(status).toBeNull();
    });
});
