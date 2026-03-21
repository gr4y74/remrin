/** @jest-environment node */
import { describe, it, expect, jest } from '@jest/globals'
import * as dotenv from 'dotenv'
import path from 'path'
import { setupGlobalRequest } from './test-utils'

// Mock next/headers
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
    })),
}))

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
setupGlobalRequest()

import { ensureHomeWorkspace } from '../lib/auth/workspace'
import { createAdminClient } from '../lib/supabase/server'

describe('Workspace Initialization Logic', () => {
    it('should create a Home workspace if it does not exist', async () => {
        const supabase = createAdminClient()
        const email = `test-init-${Date.now()}@example.com`

        // 1. Create a real auth user
        const { data: { user }, error: userErr } = await supabase.auth.admin.createUser({
            email,
            password: 'TestPassword123!',
            email_confirm: true
        })

        if (userErr || !user) throw new Error(`Failed to create test user: ${userErr?.message}`)
        const userId = user.id

        try {
            console.log(`Testing ensureHomeWorkspace for real user: ${userId}`)

            const workspace = await ensureHomeWorkspace(supabase, userId)

            expect(workspace).toBeTruthy()
            expect(workspace.user_id).toBe(userId)
            expect(workspace.is_home).toBe(true)
            expect(workspace.name).toBe('Home')

            console.log('✅ Successfully created default workspace for real user.')
        } finally {
            // Clean up workspace and user
            await supabase.from('workspaces').delete().eq('user_id', userId)
            await supabase.auth.admin.deleteUser(userId)
        }
    })

    it('should return existing Home workspace if it exists', async () => {
        const supabase = createAdminClient()
        const email = `test-init-exist-${Date.now()}@example.com`

        const { data: { user } } = await supabase.auth.admin.createUser({
            email,
            password: 'TestPassword123!',
            email_confirm: true
        })
        if (!user) throw new Error("User creation failed")
        const userId = user.id

        try {
            // 1. Pre-create a workspace
            await supabase.from('workspaces').insert({
                user_id: userId,
                name: 'Existing Home',
                is_home: true,
                default_model: 'gpt-4o',
                embeddings_provider: 'openai',
                default_context_length: 4096
            })

            const workspace = await ensureHomeWorkspace(supabase, userId)
            expect(workspace.name).toBe('Existing Home')
            console.log('✅ Corrected returned existing workspace.')
        } finally {
            await supabase.from('workspaces').delete().eq('user_id', userId)
            await supabase.auth.admin.deleteUser(userId)
        }
    })
})
