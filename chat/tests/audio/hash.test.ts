import {
    createTextHash,
    createSecureTextHash,
    createVoiceConfigHash,
    createShortHash,
    isValidHash
} from '../../lib/audio/utils/hash';

describe('Audio Hash Utilities', () => {
    const text = 'Hello, world!';
    const voiceId = 'test-voice-id';
    const settings = { speed: 1.0, pitch: 0 };

    describe('createTextHash (MD5)', () => {
        it('should generate deterministic hashes', () => {
            const hash1 = createTextHash(text, voiceId, settings);
            const hash2 = createTextHash(text, voiceId, settings);
            const hash3 = createTextHash(text + ' ', voiceId, settings); // Should normalize input

            expect(hash1).toBe(hash2);
            expect(hash1).toBe(hash3);
            expect(hash1).toHaveLength(32);
        });

        it('should produce different hashes for different inputs', () => {
            const hash1 = createTextHash(text, voiceId, settings);
            const hash2 = createTextHash('different text', voiceId, settings);
            const hash3 = createTextHash(text, 'other-voice', settings);
            const hash4 = createTextHash(text, voiceId, { speed: 1.5 });

            expect(hash1).not.toBe(hash2);
            expect(hash1).not.toBe(hash3);
            expect(hash1).not.toBe(hash4);
        });

        it('should handle missing settings', () => {
            const hash1 = createTextHash(text, voiceId);
            const hash2 = createTextHash(text, voiceId, {});

            expect(hash1).toBe(hash2); // Empty object should be same as undefined
        });

        it('should be insensitive to settings key order', () => {
            const hash1 = createTextHash(text, voiceId, { a: 1, b: 2 });
            const hash2 = createTextHash(text, voiceId, { b: 2, a: 1 });

            expect(hash1).toBe(hash2);
        });
    });

    describe('createSecureTextHash (SHA-256)', () => {
        it('should generate 64-character hashes', () => {
            const hash = createSecureTextHash(text, voiceId, settings);
            expect(hash).toHaveLength(64);
        });

        it('should be deterministic', () => {
            const hash1 = createSecureTextHash(text, voiceId, settings);
            const hash2 = createSecureTextHash(text, voiceId, settings);
            expect(hash1).toBe(hash2);
        });
    });

    describe('createVoiceConfigHash', () => {
        it('should work with config objects', () => {
            const config = {
                voiceId,
                provider: 'test-provider',
                settings
            };

            const hash = createVoiceConfigHash(text, config);
            const expected = createTextHash(text, voiceId, { provider: 'test-provider', ...settings });

            expect(hash).toBe(expected);
        });
    });

    describe('isValidHash', () => {
        it('should validate MD5 hashes', () => {
            const valid = 'd41d8cd98f00b204e9800998ecf8427e';
            const invalid = 'd41d8cd98f'; // too short
            const nonHex = 'z41d8cd98f00b204e9800998ecf8427e';

            expect(isValidHash(valid, 'md5')).toBe(true);
            expect(isValidHash(invalid, 'md5')).toBe(false);
            expect(isValidHash(nonHex, 'md5')).toBe(false);
        });

        it('should validate SHA-256 hashes', () => {
            // 64 chars
            const valid = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
            const invalid = 'e3b0c4';

            expect(isValidHash(valid, 'sha256')).toBe(true);
            expect(isValidHash(invalid, 'sha256')).toBe(false);
        });
    });
});
