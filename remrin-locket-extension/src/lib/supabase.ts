/**
 * Supabase client for extension
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wftsctqfiqbdyllxwagi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdHNjdHFmaXFiZHlsbHh3YWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MjE0NTksImV4cCI6MjA3OTk5NzQ1OX0.FWqZTUi5gVA3SpOq_Hp1LlxEinJvfloqw3OhoQlcfwg'

let supabaseInstance: SupabaseClient | null = null

/**
 * Get or create Supabase client
 */
export function getSupabase(): SupabaseClient {
    if (!supabaseInstance) {
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                storageKey: 'remrin-locket-auth',
                storage: {
                    getItem: async (key) => {
                        const result = await chrome.storage.local.get(key)
                        return result[key] || null
                    },
                    setItem: async (key, value) => {
                        await chrome.storage.local.set({ [key]: value })
                    },
                    removeItem: async (key) => {
                        await chrome.storage.local.remove(key)
                    }
                }
            }
        })
    }
    return supabaseInstance
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) throw error
    return data
}

/**
 * Sign out
 */
export async function signOut() {
    const supabase = getSupabase()
    await supabase.auth.signOut()
}

/**
 * Get current session
 */
export async function getSession() {
    const supabase = getSupabase()
    const { data } = await supabase.auth.getSession()
    return data.session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const session = await getSession()
    return !!session
}
