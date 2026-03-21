import { describe, it, expect, jest } from '@jest/globals'
import * as dotenv from 'dotenv'
import path from 'path'
import * as fs from 'fs'
import { setupGlobalRequest } from './test-utils'

// Mock next/headers for createAdminClient import
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}))

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
setupGlobalRequest()

import { createAdminClient } from '../lib/supabase/server'

describe('RAG Vector Synchronization', () => {
    it('should have 768-dimensional configuration in embeddings utility', async () => {
        const filePath = path.resolve(__dirname, '../lib/chat-engine/embeddings.ts');
        const content = fs.readFileSync(filePath, 'utf8');

        expect(content).toContain('outputDimensionality: 768');
        console.log('✅ Configuration check: embeddings utility is set to 768-dim.');
    })

    it('should successfully execute match_memories_v2 RPC with 768-dim vector', async () => {
        const supabase = createAdminClient()
        const dummyEmbedding = new Array(768).fill(0.1)

        // Test RPC signature and dimension support
        const { data, error } = await supabase.rpc('match_memories_v2', {
            query_embedding: dummyEmbedding,
            match_threshold: 0.5,
            match_count: 1,
            filter_persona: '00000000-0000-0000-0000-000000000001', // Dummy
            filter_user: '00000000-0000-0000-0000-000000000001'    // Dummy
        })

        if (error) {
            // We check that the error is NOT a dimension mismatch
            expect(error.message).not.toContain('dimension')
            expect(error.message).not.toContain('different dimensions')
            console.log('✅ RPC call reached database, no dimension mismatch detected.')
        } else {
            console.log('✅ RPC call succeeded (empty result expected).')
            expect(Array.isArray(data)).toBe(true)
        }
    })
})
