
/**
 * Remrin Semantic Embedding Utility
 * 
 * Provides vector embeddings for memories and search queries.
 * Primary provider: Google Gemini (text-embedding-004)
 */

import { createAdminClient } from '@/lib/supabase/server'

const GEMINI_EMBEDDING_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"

/**
 * Generate a vector embedding for a given text
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        // 1. Get the Google API key from the database
        const supabase = createAdminClient()
        const { data: keyData, error: keyErr } = await supabase
            .from('api_keys')
            .select('api_key')
            .eq('provider', 'google')
            .single()

        if (keyErr || !keyData?.api_key) {
            console.error('[Embeddings] Google API key not found in database')
            return null
        }

        const apiKey = keyData.api_key

        // 2. Call Gemini embedding API
        const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: {
                    parts: [{ text }]
                },
                outputDimensionality: 768
            })
        })

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            console.error(`[Embeddings] Gemini API error: ${response.status}`, err)
            return null
        }

        const data = await response.json()
        const embedding = data.embedding?.values

        if (!embedding || !Array.isArray(embedding)) {
            console.error('[Embeddings] Invalid response format from Gemini')
            return null
        }

        return embedding
    } catch (error) {
        console.error('[Embeddings] Failed to generate embedding:', error)
        return null
    }
}
